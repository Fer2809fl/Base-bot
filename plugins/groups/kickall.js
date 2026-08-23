'use strict';

export default {
  command: ['kickall', 'expulsarall'],
  category: 'grupo',
  description: 'Expulsa a todos los no-admins',
  group: true,
  botAdmin: true,
  superAdmin: true,
  run: async ({ sock, m, from }) => {
    const meta = await sock.groupMetadata(from);
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const botNum = extractNum(sock.user.id);

    const nonAdmins = meta.participants
      .filter(p => (!p.admin || p.admin === 'none') && extractNum(p.id) !== botNum)
      .map(p => p.id);

    if (nonAdmins.length === 0) return sock.sendMessage(from, { text: '✅ No hay no-admins.' }, { quoted: m });

    await sock.sendMessage(from, { text: `⚠️ Expulsando ${nonAdmins.length}...` }, { quoted: m });

    for (const id of nonAdmins) {
      try { await sock.groupParticipantsUpdate(from, [id], 'remove'); } catch {}
      await new Promise(r => setTimeout(r, 500));
    }

    await sock.sendMessage(from, { text: `✅ ${nonAdmins.length} expulsados.` }, { quoted: m });
  },
};
