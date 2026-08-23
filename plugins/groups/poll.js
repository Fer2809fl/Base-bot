'use strict';

export default {
  command: ['poll', 'encuesta', 'vote'],
  category: 'grupo',
  description: 'Crea una encuesta',
  group: true,
  argsRequired: true,
  usage: 'Uso: .poll Pregunta | Opción1 | Opción2',
  run: async ({ sock, m, from, args }) => {
    const parts = args.join(' ').split('|').map(s => s.trim());
    if (parts.length < 3) {
      return sock.sendMessage(from, { text: '📝 Uso: .poll ¿Quién gana? | Opción 1 | Opción 2 | Opción 3' }, { quoted: m });
    }

    const question = parts[0];
    const options = parts.slice(1);

    try {
      await sock.sendMessage(from, {
        poll: {
          name: question,
          values: options,
          selectableCount: 1,
        },
      });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
    }
  },
};
