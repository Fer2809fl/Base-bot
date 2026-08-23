'use strict';

export default {
  command: ['demote', 'quitaradmin', 'degradar'],
  category: 'grupo',
  description: 'Quita el admin a un usuario',
  group: true,
  botAdmin: true,
  superAdmin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .demote @usuario' }, { quoted: m });

    try {
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} ya no es admin.`, mentions: [target] }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
