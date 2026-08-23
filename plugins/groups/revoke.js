'use strict';

export default {
  command: ['revoke', 'revocar', 'resetlink'],
  category: 'grupo',
  description: 'Revoca el link del grupo',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from }) => {
    try {
      await sock.groupRevokeInvite(from);
      const newCode = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `✅ Link revocado.\nhttps://chat.whatsapp.com/${newCode}` }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
