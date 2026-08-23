'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['boton', 'botoff', 'bot'],
  category: 'grupo',
  description: 'Activa o desactiva el bot en el grupo',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      config.botOff = false;
      await sock.sendMessage(from, { text: '🤖 Bot ACTIVADO en este grupo.' }, { quoted: m });
    } else if (action === 'off') {
      config.botOff = true;
      await sock.sendMessage(from, { text: '🤖 Bot DESACTIVADO en este grupo.' }, { quoted: m });
    } else {
      config.botOff = !config.botOff;
      await sock.sendMessage(from, { text: `🤖 Bot ${config.botOff ? '❌ DESACTIVADO' : '✅ ACTIVADO'} en este grupo.` }, { quoted: m });
    }
  },
};
