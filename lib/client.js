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

const logger = pino({ level: 'silent' });

let mainBotSocket = null;
let reconnectAttempts = 0;

let persistedState = null;
let persistedMemoryKeys = null;
const MAX_RECONNECT_DELAY_MS = 30000;

function getReconnectDelay() {
  const delay = Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY_MS);
  reconnectAttempts++;
  return delay;
}

export function getMainBotSocket() {
  return mainBotSocket;
}

const MAX_STORED_MESSAGES = 5000;
const messageStore = new Map();

function rememberMessage(id, message) {
  if (!id || !message) return;
  if (messageStore.size >= MAX_STORED_MESSAGES) {
    const oldestKey = messageStore.keys().next().value;
    if (oldestKey) messageStore.delete(oldestKey);
  }
  messageStore.set(id, message);
}

const msgRetryCounterCache = new NodeCache({ stdTTL: 60 * 60, useClones: false });

const PHONE_REGEX = /^\d{8,15}$/;

let rl = null;

function getReadline() {
  if (!rl) {
    if (!process.stdin.isTTY) {
      throw new Error('No interactive terminal available');
    }
    try {
      rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    } catch {
      throw new Error('Could not create readline interface');
    }
  }
  return rl;
}

function sanitizePhoneNumber(raw) {
  return raw.replace(/[^\d]/g, '');
}

async function askUntilValid(question, invalidMessage, isValid, sanitize = (v) => v.trim()) {
  const ri = getReadline();
  let value = sanitize(await ri.question(question));

  while (!isValid(value)) {
    value = sanitize(await ri.question(invalidMessage));
  }

  return value;
}

function hasExistingSession(folder) {
  return fs.existsSync(path.join(folder, 'creds.json'));
}

function fixFileName(file) {
  return file.replace(/\//g, '__').replace(/:/g, '-');
}

function createInMemoryAuthState() {
  const creds = initAuthCreds();
  const keys = new Map();

  const state = {
    creds,
    keys: {
      get: async (type, ids) => {
        const result = {};
        for (const id of ids) {
          let value = keys.get(`${type}:${id}`);
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          if (value !== undefined) result[id] = value;
        }
        return result;
      },
      set: async (data) => {
        for (const type of Object.keys(data)) {
          const entries = data[type];
          for (const id of Object.keys(entries)) {
            const value = entries[id];
            const key = `${type}:${id}`;
            if (value) keys.set(key, value);
            else keys.delete(key);
          }
        }
      },
    },
  };

  return { state, keys };
}

async function persistAuthStateToDisk(folder, creds, keys) {
  await fs.promises.mkdir(folder, { recursive: true });
  await fs.promises.writeFile(
    path.join(folder, 'creds.json'),
    JSON.stringify(creds, BufferJSON.replacer, 2)
  );

  for (const [combinedKey, value] of keys) {
    const sep = combinedKey.indexOf(':');
    const type = combinedKey.slice(0, sep);
    const id = combinedKey.slice(sep + 1);
    const fileName = fixFileName(`${type}-${id}.json`);
    await fs.promises.writeFile(path.join(folder, fileName), JSON.stringify(value, BufferJSON.replacer));
  }
}

let cachedLogin = null;

async function resolveLoginMethod() {
  if (cachedLogin) return cachedLogin;

  const forcedMethod = (process.env.LOGIN_METHOD || '').trim().toLowerCase();
  if (forcedMethod === 'qr') {
    console.log('📱 LOGIN_METHOD=qr detectado. Forzando vinculación por QR...');
    cachedLogin = { method: 'qr' };
    return cachedLogin;
  }

  const envPhone = process.env.BOT_PHONE || config.phoneNumber || '';
  if (envPhone) {
    const cleanPhone = sanitizePhoneNumber(envPhone);
    if (cleanPhone.length >= 8) {
      console.log(`📞 Usando número configurado: ${cleanPhone}`);
      cachedLogin = { method: 'code', phoneNumber: cleanPhone };
      return cachedLogin;
    }
  }

  try {
    const ri = getReadline();
    console.log('\n¿Cómo quieres vincular el bot?');
    console.log('  1) QR');
    console.log('  2) Código de vinculación (pairing code)');

    const opcion = await askUntilValid(
      'Elige una opción (1/2): ',
      'Opción inválida. Escribe 1 (QR) o 2 (Código): ',
      (v) => v === '1' || v === '2'
    );

    if (opcion === '1') {
      cachedLogin = { method: 'qr' };
      return cachedLogin;
    }

    const configuredNumber = sanitizePhoneNumber(config.phoneNumber ?? '');
    let phoneNumber = configuredNumber;

    if (phoneNumber) {
      console.log(`📞 Usando el número configurado en config.js: ${phoneNumber}`);
    } else {
      phoneNumber = await askUntilValid(
        'No hay número configurado. Escribe el número con código de país (ej: 5214181234567): ',
        'Número inválido. Debe contener solo dígitos con código de país (ej: 5214181234567): ',
        (v) => PHONE_REGEX.test(v),
        sanitizePhoneNumber
      );
    }

    cachedLogin = { method: 'code', phoneNumber };
    return cachedLogin;
  } catch (err) {
    console.log('\n⚠️  No hay terminal interactivo disponible. Usando modo QR...');
    cachedLogin = { method: 'qr' };
    return cachedLogin;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPairingCode(sock, phoneNumber) {
  try {
    await sleep(3000);
    const code = await sock.requestPairingCode(phoneNumber);
    console.log('\n🔗 Tu código de vinculación es:');
    console.log(`   👉 ${code}`);
    console.log('Ingresa este código en WhatsApp > Dispositivos vinculados > Vincular con número de teléfono.\n');
  } catch (err) {
    console.error('❌ No se pudo generar el código de vinculación:', err);
  }
}

export async function createClient(onReady) {
  let state;
  let memoryKeys = null;
  const saveCredsRef = { current: async () => {} };
  let alreadyLinked;

  if (persistedState && persistedMemoryKeys) {
    state = persistedState;
    memoryKeys = persistedMemoryKeys;
    alreadyLinked = true;
    console.log('🔄 Reconectando con la sesión recién vinculada (guardándose en disco)...');
  } else if (hasExistingSession(config.authFolder)) {
    const loaded = await useMultiFileAuthState(config.authFolder);
    state = loaded.state;
    saveCredsRef.current = loaded.saveCreds;
    alreadyLinked = true;
    console.log(`🔄 Sesión existente detectada en "${config.authFolder}", reconectando...`);
  } else {
    const mem = createInMemoryAuthState();
    state = mem.state;
    memoryKeys = mem.keys;
    alreadyLinked = false;
  }

  persistedState = state;
  persistedMemoryKeys = memoryKeys;

  const { version } = await fetchLatestBaileysVersion();

  const { method, phoneNumber } = alreadyLinked
    ? { method: 'qr', phoneNumber: undefined }
    : await resolveLoginMethod();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (!key.id) return undefined;
      return messageStore.get(key.id);
    },
  });

  const originalSendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async (jid, content, options) => {
    const sent = await originalSendMessage(jid, content, options);
    rememberMessage(sent?.key?.id, sent?.message);
    return sent;
  };

  if (!alreadyLinked && method === 'code' && phoneNumber) {
    void sendPairingCode(sock, phoneNumber);
  }

  sock.ev.on('creds.update', () => {
    void saveCredsRef.current();
  });

  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const m of messages) {
      rememberMessage(m.key?.id, m.message);
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && method === 'qr') {
      console.log('📱 Escanea este QR con WhatsApp (Dispositivos vinculados):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log('⚠️  Conexión cerrada.', { shouldReconnect, statusCode });

      if (shouldReconnect) {
        const delay = getReconnectDelay();
        console.log(`⏳ Reintentando en ${Math.round(delay / 1000)}s...`);
        setTimeout(() => createClient(onReady), delay);
      } else {
        console.log(`❌ Sesión cerrada. Borra la carpeta "${config.authFolder}" y vuelve a vincular.`);
        persistedState = null;
        persistedMemoryKeys = null;
        cachedLogin = null;
      }
    } else if (connection === 'open') {
      console.log(`✅ ${config.botName} conectado correctamente.`);
      reconnectAttempts = 0;
      mainBotSocket = sock;

      if (memoryKeys && state.creds.registered) {
        try {
          await persistAuthStateToDisk(config.authFolder, state.creds, memoryKeys);

          const loaded = await useMultiFileAuthState(config.authFolder);
          saveCredsRef.current = loaded.saveCreds;
          memoryKeys = null;
          persistedState = null;
          persistedMemoryKeys = null;
        } catch (err) {
          console.error('❌ Error guardando la sesión en disco, se reintentará en el próximo reconnect:', err);
        }
      }

      try {
        if (rl) {
          rl.close();
          rl = null;
        }
      } catch {}
      onReady(sock);
    }
  });
}