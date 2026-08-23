'use strict';

export default {
  command: ['admins', 'listadmin', 'adminlist'],
  category: 'grupo',
  description: 'Lista todos los admins del grupo',
  group: true,
  run: async ({ sock, m, from }) => {
    const meta = await sock.groupMetadata(from);
    const admins = meta.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

    if (admins.length === 0) {
      return sock.sendMessage(from, { text: 'ℹ️ No hay admins en este grupo.' }, { quoted: m });
    }

    const list = admins.map((a, i) => `${i + 1}. @${a.id.split('@')[0]} ${a.admin === 'superadmin' ? '(👑 Creador)' : '(🛡️ Admin)'}`).join('\n');
    await sock.sendMessage(from, {
      text: `🛡️ *Admins del grupo:* (${admins.length})\n\n${list}`,
      mentions: admins.map(a => a.id),
    }, { quoted: m });
  },
};
