'use strict';

export default {
  command: ['kick', 'expulsar', 'ban'],
  category: 'grupo',
  description: 'Expulsa a un usuario del grupo',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .kick @usuario' }, { quoted: m });

    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetNum = extractNum(target);

    const meta = await sock.groupMetadata(from);
    const targetUser = meta.participants.find(p => extractNum(p.id) === targetNum);
    if (targetUser?.admin === 'superadmin') {
      return sock.sendMessage(from, { text: '⛔ No puedo expulsar al superadmin.' }, { quoted: m });
    }

    try {
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} expulsado.`, mentions: [target] }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
