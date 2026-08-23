'use strict';

export default {
  command: ['link', 'invite', 'enlace'],
  category: 'grupo',
  description: 'Obtiene el link del grupo',
  group: true,
  botAdmin: true,
  run: async ({ sock, m, from }) => {
    try {
      const code = await sock.groupInviteCode(from);
      const meta = await sock.groupMetadata(from);
      await sock.sendMessage(from, {
        text: `🔗 *${meta.subject}*\n\nhttps://chat.whatsapp.com/${code}`,
      }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
