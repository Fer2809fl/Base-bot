import { createClient } from './lib/client.js';
import { loadPlugins, handleMessage } from './lib/handler.js';

await loadPlugins();

createClient((sock) => {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });
}).catch((err) => console.error('❌ Error al iniciar el bot:', err));