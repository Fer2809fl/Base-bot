'use strict';

export default {
  command: ['groupinfo', 'infogrupo', 'ginfo'],
  category: 'grupo',
  description: 'Muestra información del grupo',
  group: true,
  run: async ({ sock, m, from }) => {
    try {
      const meta = await sock.groupMetadata(from);
      const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
      const participants = meta.participants;
      const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
      const owner = participants.find(p => p.admin === 'superadmin');

      const text = [
        `📌 *${meta.subject}*`,
        ``,
        `📝 *Descripción:* ${meta.desc || 'Sin descripción'}`,
        `👥 *Miembros:* ${participants.length}`,
        `👑 *Admins:* ${admins.length}`,
        `🔑 *Creador:* @${extractNum(owner?.id) || 'N/A'}`,
        `🔒 *Solo admins:* ${meta.announce ? 'Sí' : 'No'}`,
      ].join('\n');

      await sock.sendMessage(from, { text, mentions: owner?.id ? [owner.id] : [] }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
