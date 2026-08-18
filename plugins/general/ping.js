'use strict';

module.exports = {
  command: ['ping'],
  category: 'general',
  description: 'Muestra la velocidad de respuesta del bot',
  run: async ({ sock, m, from }) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: m });
    const ms = Date.now() - start;
    await sock.sendMessage(from, { text: `⚡ Velocidad: *${ms}ms*` });
  },
};
