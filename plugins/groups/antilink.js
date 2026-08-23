'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['antilink'],
  category: 'grupo',
  description: 'Activa/desactiva el antilink del grupo',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      config.antilink = true;
      await sock.sendMessage(from, { text: '🔗 Antilink ✅ ACTIVADO.' }, { quoted: m });
    } else if (action === 'off') {
      config.antilink = false;
      await sock.sendMessage(from, { text: '🔗 Antilink ❌ DESACTIVADO.' }, { quoted: m });
    } else {
      config.antilink = !config.antilink;
      await sock.sendMessage(from, { text: `🔗 Antilink ${config.antilink ? '✅ ACTIVADO' : '❌ DESACTIVADO'}` }, { quoted: m });
    }
  },
};
