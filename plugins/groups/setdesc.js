'use strict';

export default {
  command: ['setdesc', 'descripcion'],
  category: 'grupo',
  description: 'Cambia la descripción del grupo',
  group: true,
  botAdmin: true,
  admin: true,
  argsRequired: true,
  usage: 'Uso: .setdesc Nueva descripción',
  run: async ({ sock, m, from, text }) => {
    try {
      await sock.groupUpdateDescription(from, text);
      await sock.sendMessage(from, { text: '✅ Descripción actualizada.' }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
