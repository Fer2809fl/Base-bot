'use strict';

export default {
  command: ['hidetag', 'ht', 'tagall', 'everyone', 'mentionall'],
  category: 'grupo',
  description: 'Menciona a todos silenciosamente',
  group: true,
  run: async ({ sock, m, from, text }) => {
    const botMeta = await sock.groupMetadata(from);
    const participants = botMeta.participants.map(p => p.id);
    const messageText = text || '📢 ¡Atención!';

    // Enviar imagen vacía con menciones (menciones silenciosas)
    // O enviar texto normal con mentions
    await sock.sendMessage(from, {
      text: messageText,
      mentions: participants,
    }, { quoted: m });
  },
};
