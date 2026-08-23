'use strict';

export default {
  command: ['close', 'abrir', 'open', 'cerrar'],
  category: 'grupo',
  description: 'Abre o cierra el grupo',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const action = args[0]?.toLowerCase();
    const isClose = action === 'close' || action === 'cerrar';

    try {
      await sock.groupSettingUpdate(from, isClose ? 'announcement' : 'not_announcement');
      await sock.sendMessage(from, { text: isClose ? '🔒 Grupo CERRADO.' : '🔓 Grupo ABIERTO.' }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
