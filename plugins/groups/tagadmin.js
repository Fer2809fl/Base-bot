'use strict';

export default {
  command: ['tagadmin', 'adminsalert'],
  category: 'grupo',
  description: 'Menciona a todos los admins',
  group: true,
  run: async ({ sock, m, from, text }) => {
    const meta = await sock.groupMetadata(from);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);

    if (admins.length === 0) return sock.sendMessage(from, { text: 'ℹ️ No hay admins.' }, { quoted: m });

    const msg = text || '📢 ¡Atención admins!';
    await sock.sendMessage(from, {
      text: `${msg}\n\n${admins.map(a => `@${a.split('@')[0]}`).join(' ')}`,
      mentions: admins,
    }, { quoted: m });
  },
};
