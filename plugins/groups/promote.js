'use strict';

export default {
  command: ['promote', 'promover', 'makeadmin'],
  category: 'grupo',
  description: 'Promueve a un usuario a admin',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .promote @usuario' }, { quoted: m });

    try {
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} ahora es admin.`, mentions: [target] }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
