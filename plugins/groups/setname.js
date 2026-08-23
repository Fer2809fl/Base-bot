'use strict';

export default {
  command: ['setname', 'setsubject', 'nombredelgrupo'],
  category: 'grupo',
  description: 'Cambia el nombre del grupo',
  group: true,
  botAdmin: true,
  admin: true,
  argsRequired: true,
  usage: 'Uso: .setname Nuevo nombre',
  run: async ({ sock, m, from, text }) => {
    try {
      await sock.groupUpdateSubject(from, text);
      await sock.sendMessage(from, { text: `✅ Nombre: *${text}*` }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
