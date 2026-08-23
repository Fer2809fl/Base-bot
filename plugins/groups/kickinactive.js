'use strict';

export default {
  command: ['kickinactive', 'expulsarinactivos'],
  category: 'grupo',
  description: 'Expulsa miembros inactivos',
  group: true,
  botAdmin: true,
  superAdmin: true,
  run: async ({ sock, m, from }) => {
    const meta = await sock.groupMetadata(from);
    const nonAdmins = meta.participants.filter(p => !p.admin || p.admin === 'none');

    if (nonAdmins.length === 0) return sock.sendMessage(from, { text: '✅ No hay inactivos.' }, { quoted: m });

    await sock.sendMessage(from, { text: `🔍 Verificando ${nonAdmins.length} miembros...` }, { quoted: m });
    await sock.sendMessage(from, { text: `ℹ️ Usa *.kick @usuario* para expulsar inactivos manualmente.` }, { quoted: m });
  },
};
