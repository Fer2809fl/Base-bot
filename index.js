import { createClient } from './lib/client.js';
import { loadPlugins, handleMessage, welcomeHandler } from './lib/handler.js';
import logger from './lib/logger.js';

logger.startup('Asta');

await loadPlugins();

createClient((sock) => {
  // ─── Mensajes entrantes ───
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });

  // ─── Welcome/Goodbye (entrar/salir del grupo) ───
  sock.ev.on('group-participants.update', async (update) => {
    await welcomeHandler(sock, update);
  });
}).catch((err) => logger.error('Error al iniciar el bot:', err.message || err));
