import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  initAuthCreds,
  BufferJSON,
  proto,
} from '@fer2809fl/baileys';

import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import readline from 'node:readline/promises';
import fs from 'node:fs';
import path from 'node:path';

import config from '../config.js';

const logger = pino({
  level: 'silent'
});

let mainBotSocket = null;
let reconnectAttempts = 0;

let persistedState = null;
let persistedMemoryKeys = null;

const MAX_RECONNECT_DELAY_MS = 30000;

// ======================================================
// RECONEXIÓN
// ======================================================

function getReconnectDelay() {

  const delay =
    Math.min(
      1000 * 2 ** reconnectAttempts,
      MAX_RECONNECT_DELAY_MS
    );

  reconnectAttempts++;

  return delay;
}

// ======================================================
// SOCKET
// ======================================================

export function getMainBotSocket() {
  return mainBotSocket;
}

// ======================================================
// MENSAJES
// ======================================================

const MAX_STORED_MESSAGES = 5000;

const messageStore =
  new Map();

function rememberMessage(
  id,
  message
) {

  if (
    !id ||
    !message
  ) {
    return;
  }

  if (
    messageStore.size >=
    MAX_STORED_MESSAGES
  ) {

    const oldestKey =
      messageStore
        .keys()
        .next()
        .value;

    if (oldestKey) {
      messageStore.delete(
        oldestKey
      );
    }
  }

  messageStore.set(
    id,
    message
  );
}

// ======================================================
// RETRY
// ======================================================

const msgRetryCounterCache =
  new NodeCache({
    stdTTL: 60 * 60,
    useClones: false
  });

// ======================================================
// TELÉFONO
// ======================================================

const PHONE_REGEX =
  /^\d{8,15}$/;

let rl = null;

function getReadline() {

  if (!rl) {

    if (!process.stdin.isTTY) {
      throw new Error(
        'No interactive terminal available'
      );
    }

    try {

      rl =
        readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

    } catch {

      throw new Error(
        'Could not create readline interface'
      );
    }
  }

  return rl;
}

// ======================================================
// LIMPIAR TELÉFONO
// ======================================================

function sanitizePhoneNumber(
  raw
) {

  return String(raw || '')
    .replace(/[^\d]/g, '');
}

// ======================================================
// PREGUNTA
// ======================================================

async function askUntilValid(
  question,
  invalidMessage,
  isValid,
  sanitize = v => v.trim()
) {

  const ri =
    getReadline();

  let value =
    sanitize(
      await ri.question(
        question
      )
    );

  while (
    !isValid(value)
  ) {

    value =
      sanitize(
        await ri.question(
          invalidMessage
        )
      );
  }

  return value;
}

// ======================================================
// SESIÓN
// ======================================================

function hasExistingSession(
  folder
) {

  return fs.existsSync(
    path.join(
      folder,
      'creds.json'
    )
  );
}

// ======================================================
// NOMBRE DE ARCHIVO
// ======================================================

function fixFileName(
  file
) {

  return file
    .replace(/\//g, '__')
    .replace(/:/g, '-');
}

// ======================================================
// AUTH STATE EN MEMORIA
// ======================================================
//
// IMPORTANTE:
// No limitamos los tipos de claves.
// Baileys puede utilizar claves adicionales,
// incluyendo las necesarias para LID.
// ======================================================

function createInMemoryAuthState() {

  const creds =
    initAuthCreds();

  const keys =
    new Map();

  const state = {

    creds,

    keys: {

      get:
        async (
          type,
          ids
        ) => {

          const result = {};

          for (
            const id of ids
          ) {

            let value =
              keys.get(
                `${type}:${id}`
              );

            // --------------------------------
            // App state sync
            // --------------------------------

            if (
              type ===
              'app-state-sync-key' &&
              value
            ) {

              value =
                proto.Message
                  .AppStateSyncKeyData
                  .fromObject(
                    value
                  );
            }

            if (
              value !== undefined
            ) {

              result[id] =
                value;
            }
          }

          return result;
        },

      set:
        async (
          data
        ) => {

          for (
            const type of
            Object.keys(data)
          ) {

            const entries =
              data[type];

            for (
              const id of
              Object.keys(entries)
            ) {

              const value =
                entries[id];

              const key =
                `${type}:${id}`;

              if (
                value
              ) {

                keys.set(
                  key,
                  value
                );

              } else {

                keys.delete(
                  key
                );
              }
            }
          }
        }
    }
  };

  return {
    state,
    keys
  };
}

// ======================================================
// GUARDAR AUTH EN DISCO
// ======================================================

async function persistAuthStateToDisk(
  folder,
  creds,
  keys
) {

  await fs.promises.mkdir(
    folder,
    {
      recursive: true
    }
  );

  // ------------------------------------------
  // Credenciales
  // ------------------------------------------

  await fs.promises.writeFile(
    path.join(
      folder,
      'creds.json'
    ),
    JSON.stringify(
      creds,
      BufferJSON.replacer,
      2
    )
  );

  // ------------------------------------------
  // Todas las claves
  // ------------------------------------------

  for (
    const [
      combinedKey,
      value
    ] of keys
  ) {

    const sep =
      combinedKey.indexOf(':');

    const type =
      combinedKey.slice(
        0,
        sep
      );

    const id =
      combinedKey.slice(
        sep + 1
      );

    const fileName =
      fixFileName(
        `${type}-${id}.json`
      );

    await fs.promises.writeFile(
      path.join(
        folder,
        fileName
      ),
      JSON.stringify(
        value,
        BufferJSON.replacer
      )
    );
  }
}

// ======================================================
// LOGIN
// ======================================================

let cachedLogin = null;

async function resolveLoginMethod() {

  if (cachedLogin) {
    return cachedLogin;
  }

  const forcedMethod =
    (
      process.env.LOGIN_METHOD ||
      ''
    )
      .trim()
      .toLowerCase();

  // ------------------------------------------
  // QR
  // ------------------------------------------

  if (
    forcedMethod === 'qr'
  ) {

    console.log(
      '📱 LOGIN_METHOD=qr detectado. Forzando vinculación por QR...'
    );

    cachedLogin = {
      method: 'qr'
    };

    return cachedLogin;
  }

  // ------------------------------------------
  // Número configurado
  // ------------------------------------------

  const envPhone =
    process.env.BOT_PHONE ||
    config.phoneNumber ||
    '';

  if (envPhone) {

    const cleanPhone =
      sanitizePhoneNumber(
        envPhone
      );

    if (
      cleanPhone.length >= 8
    ) {

      console.log(
        `📞 Usando número configurado: ${cleanPhone}`
      );

      cachedLogin = {
        method: 'code',
        phoneNumber:
          cleanPhone
      };

      return cachedLogin;
    }
  }

  // ------------------------------------------
  // Preguntar
  // ------------------------------------------

  try {

    const ri =
      getReadline();

    console.log(
      '\n¿Cómo quieres vincular el bot?'
    );

    console.log(
      '  1) QR'
    );

    console.log(
      '  2) Código de vinculación (pairing code)'
    );

    const opcion =
      await askUntilValid(
        'Elige una opción (1/2): ',
        'Opción inválida. Escribe 1 (QR) o 2 (Código): ',
        v =>
          v === '1' ||
          v === '2'
      );

    if (
      opcion === '1'
    ) {

      cachedLogin = {
        method: 'qr'
      };

      return cachedLogin;
    }

    // ----------------------------------------
    // Pairing
    // ----------------------------------------

    const configuredNumber =
      sanitizePhoneNumber(
        config.phoneNumber ?? ''
      );

    let phoneNumber =
      configuredNumber;

    if (
      phoneNumber
    ) {

      console.log(
        `📞 Usando el número configurado en config.js: ${phoneNumber}`
      );

    } else {

      phoneNumber =
        await askUntilValid(
          'No hay número configurado. Escribe el número con código de país (ej: 5214181234567): ',
          'Número inválido. Debe contener solo dígitos con código de país (ej: 5214181234567): ',
          v =>
            PHONE_REGEX.test(v),
          sanitizePhoneNumber
        );
    }

    cachedLogin = {
      method: 'code',
      phoneNumber
    };

    return cachedLogin;

  } catch (err) {

    console.log(
      '\n⚠️ No hay terminal interactivo disponible. Usando modo QR...'
    );

    cachedLogin = {
      method: 'qr'
    };

    return cachedLogin;
  }
}

// ======================================================
// SLEEP
// ======================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

// ======================================================
// PAIRING CODE
// ======================================================

async function sendPairingCode(
  sock,
  phoneNumber
) {

  try {

    await sleep(3000);

    const code =
      await sock.requestPairingCode(
        phoneNumber
      );

    console.log(
      '\n🔗 Tu código de vinculación es:'
    );

    console.log(
      `   👉 ${code}`
    );

    console.log(
      'Ingresa este código en WhatsApp > Dispositivos vinculados > Vincular con número de teléfono.\n'
    );

  } catch (err) {

    console.error(
      '❌ No se pudo generar el código de vinculación:',
      err
    );
  }
}

// ======================================================
// RESOLVER LID
// ======================================================
//
// Esta función es principalmente para comprobar
// si Baileys ya conoce la relación LID → PN.
// ======================================================

export async function resolveLidToPN(
  lid
) {

  if (
    !lid ||
    !String(lid).endsWith('@lid')
  ) {

    return null;
  }

  const sock =
    mainBotSocket;

  if (!sock) {

    console.log(
      '⚠️ No existe socket principal para resolver LID.'
    );

    return null;
  }

  try {

    const mapping =
      sock
        ?.signalRepository
        ?.lidMapping;

    if (
      mapping &&
      typeof mapping.getPNForLID ===
      'function'
    ) {

      const pn =
        await mapping.getPNForLID(
          lid
        );

      if (
        pn &&
        String(pn).endsWith(
          '@s.whatsapp.net'
        )
      ) {

        console.log(
          `✅ LID resuelto: ${lid} → ${pn}`
        );

        return pn;
      }
    }

  } catch (error) {

    console.error(
      `❌ Error resolviendo ${lid}:`,
      error?.message ||
      error
    );
  }

  console.log(
    `⚠️ Baileys todavía no conoce el PN de ${lid}`
  );

  return null;
}

// ======================================================
// CREAR CLIENTE
// ======================================================

export async function createClient(
  onReady
) {

  let state;
  let memoryKeys = null;
  let saveCredsRef = {
    current:
      async () => {}
  };

  let alreadyLinked;

  // ====================================================
  // SESIÓN EN MEMORIA
  // ====================================================

  if (
    persistedState &&
    persistedMemoryKeys
  ) {

    state =
      persistedState;

    memoryKeys =
      persistedMemoryKeys;

    alreadyLinked =
      true;

    console.log(
      '🔄 Reconectando con la sesión recién vinculada (guardándose en disco)...'
    );

  }

  // ====================================================
  // SESIÓN EXISTENTE
  // ====================================================

  else if (
    hasExistingSession(
      config.authFolder
    )
  ) {

    const loaded =
      await useMultiFileAuthState(
        config.authFolder
      );

    state =
      loaded.state;

    saveCredsRef.current =
      loaded.saveCreds;

    alreadyLinked =
      true;

    console.log(
      `🔄 Sesión existente detectada en "${config.authFolder}", reconectando...`
    );

  }

  // ====================================================
  // NUEVA SESIÓN
  // ====================================================

  else {

    const mem =
      createInMemoryAuthState();

    state =
      mem.state;

    memoryKeys =
      mem.keys;

    alreadyLinked =
      false;
  }

  persistedState =
    state;

  persistedMemoryKeys =
    memoryKeys;

  // ====================================================
  // VERSIÓN BAILEYS
  // ====================================================

  const {
    version
  } =
    await fetchLatestBaileysVersion();

  console.log(
    `📦 Baileys versión: ${version.join('.')}`
  );

  // ====================================================
  // MÉTODO LOGIN
  // ====================================================

  const {
    method,
    phoneNumber
  } =
    alreadyLinked

      ? {
          method: 'qr',
          phoneNumber:
            undefined
        }

      : await resolveLoginMethod();

  // ====================================================
  // SOCKET
  // ====================================================

  const sock =
    makeWASocket({

      version,

      logger,

      auth:
        state,

      printQRInTerminal:
        false,

      msgRetryCounterCache,

      generateHighQualityLinkPreview:
        true,

      getMessage:
        async key => {

          if (!key.id) {
            return undefined;
          }

          return messageStore.get(
            key.id
          );
        }
    });

  // ====================================================
  // GUARDAR SOCKET
  // ====================================================

  mainBotSocket =
    sock;

  // ====================================================
  // SEND MESSAGE
  // ====================================================

  const originalSendMessage =
    sock.sendMessage.bind(
      sock
    );

  sock.sendMessage =
    async (
      jid,
      content,
      options
    ) => {

      const sent =
        await originalSendMessage(
          jid,
          content,
          options
        );

      rememberMessage(
        sent?.key?.id,
        sent?.message
      );

      return sent;
    };

  // ====================================================
  // PAIRING CODE
  // ====================================================

  if (
    !alreadyLinked &&
    method === 'code' &&
    phoneNumber
  ) {

    void sendPairingCode(
      sock,
      phoneNumber
    );
  }

  // ====================================================
  // CREDENCIALES
  // ====================================================

  sock.ev.on(
    'creds.update',
    () => {

      void saveCredsRef.current();
    }
  );

  // ====================================================
  // MENSAJES
  // ====================================================

  sock.ev.on(
    'messages.upsert',
    ({
      messages
    }) => {

      for (
        const m of messages
      ) {

        rememberMessage(
          m.key?.id,
          m.message
        );
      }
    }
  );

  // ====================================================
  // DEBUG LID
  // ====================================================

  sock.ev.on(
    'lid-mapping.update',
    async update => {

      console.log(
        '🔄 Actualización de LID:',
        update
      );

      /*
       * No hacemos una conversión manual.
       * Baileys mantiene el mapping internamente.
       */
    }
  );

  // ====================================================
  // CONEXIÓN
  // ====================================================

  sock.ev.on(
    'connection.update',
    async update => {

      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      // ------------------------------------------
      // QR
      // ------------------------------------------

      if (
        qr &&
        method === 'qr'
      ) {

        console.log(
          '📱 Escanea este QR con WhatsApp (Dispositivos vinculados):'
        );

        qrcode.generate(
          qr,
          {
            small: true
          }
        );
      }

      // ------------------------------------------
      // CERRADA
      // ------------------------------------------

      if (
        connection === 'close'
      ) {

        const statusCode =
          new Boom(
            lastDisconnect?.error
          )
            ?.output
            ?.statusCode;

        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          '⚠️ Conexión cerrada.',
          {
            shouldReconnect,
            statusCode
          }
        );

        if (
          shouldReconnect
        ) {

          const delay =
            getReconnectDelay();

          console.log(
            `⏳ Reintentando en ${Math.round(delay / 1000)}s...`
          );

          setTimeout(
            () =>
              createClient(
                onReady
              ),
            delay
          );

        } else {

          console.log(
            `❌ Sesión cerrada. Borra la carpeta "${config.authFolder}" y vuelve a vincular.`
          );

          persistedState =
            null;

          persistedMemoryKeys =
            null;

          cachedLogin =
            null;

          mainBotSocket =
            null;
        }

      }

      // ------------------------------------------
      // ABIERTA
      // ------------------------------------------

      else if (
        connection === 'open'
      ) {

        console.log(
          `✅ ${config.botName} conectado correctamente.`
        );

        reconnectAttempts =
          0;

        mainBotSocket =
          sock;

        // ----------------------------------------
        // Guardar sesión temporal
        // ----------------------------------------

        if (
          memoryKeys &&
          state.creds.registered
        ) {

          try {

            await persistAuthStateToDisk(
              config.authFolder,
              state.creds,
              memoryKeys
            );

            const loaded =
              await useMultiFileAuthState(
                config.authFolder
              );

            saveCredsRef.current =
              loaded.saveCreds;

            memoryKeys =
              null;

            persistedState =
              null;

            persistedMemoryKeys =
              null;

          } catch (err) {

            console.error(
              '❌ Error guardando la sesión en disco, se reintentará en el próximo reconnect:',
              err
            );
          }
        }

        // ----------------------------------------
        // Cerrar readline
        // ----------------------------------------

        try {

          if (rl) {

            rl.close();

            rl = null;
          }

        } catch {}

        // ----------------------------------------
        // Ready
        // ----------------------------------------

        onReady(
          sock
        );
      }
    }
  );
}