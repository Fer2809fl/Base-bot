'use strict';

import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';

import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@fer2809fl/baileys';

import config from './config.js';
import { loadPlugins, handleMessage } from './lib/handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ask(text) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, config.sessionName)
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: [config.botName, 'Chrome', '1.0.0'],
  });

  if (!sock.authState.creds.registered) {
    if (config.usePairingCode === null) {
      const answer = await ask(
        '¿Cómo quieres vincular el bot?\n1) Código QR\n2) Código de 8 dígitos\nElige (1/2): '
      );
      config.usePairingCode = answer.trim() === '2';
    }

    if (config.usePairingCode) {
      const phone = await ask('📱 Ingresa tu número con código de país (sin + ni espacios): ');
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phone.replace(/\D/g, ''));
          console.log(`\n🔑 Tu código de vinculación es: ${code}\n`);
        } catch (err) {
          console.error('❌ No se pudo generar el código de vinculación:', err);
        }
      }, 3000);
    }
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !config.usePairingCode) {
      console.log('\n📷 Escanea este código QR con WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(
        '⚠️ Conexión cerrada.',
        shouldReconnect
          ? 'Reconectando...'
          : 'Sesión cerrada. Borra la carpeta de sesión para volver a vincular.'
      );

      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`✅ ${config.botName} conectado correctamente.`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });

  return sock;
}

await loadPlugins();
startBot().catch((err) => console.error('❌ Error al iniciar el bot:', err));