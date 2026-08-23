'use strict';

import { getGroupConfig, setGroupConfig } from '../../lib/database.js';

export default {
  command: ['rules', 'reglas'],
  category: 'grupo',
  description: 'Muestra/establece las reglas del grupo',
  group: true,
  run: async ({ sock, m, from, args, isUserAdmin }) => {
    const config = getGroupConfig(from);

    if (args[0] === 'set') {
      const admin = await isUserAdmin();
      if (!admin) return sock.sendMessage(from, { text: '⛔ Solo admins pueden cambiar reglas.' }, { quoted: m });

      const rules = args.slice(1).join(' ');
      if (!rules) return sock.sendMessage(from, { text: '📝 Uso: .rules set 1. No spam\n2. No links' }, { quoted: m });
      config.rules = rules;
      return sock.sendMessage(from, { text: '✅ Reglas actualizadas.' }, { quoted: m });
    }

    if (args[0] === 'clear') {
      const admin = await isUserAdmin();
      if (!admin) return sock.sendMessage(from, { text: '⛔ Solo admins.' }, { quoted: m });
      config.rules = '';
      return sock.sendMessage(from, { text: '✅ Reglas eliminadas.' }, { quoted: m });
    }

    if (!config.rules) {
      return sock.sendMessage(from, { text: '📜 No hay reglas establecidas.\n📝 Usa *.rules set* para agregarlas.' }, { quoted: m });
    }

    await sock.sendMessage(from, { text: `📜 *Reglas del grupo:*\n\n${config.rules}` }, { quoted: m });
  },
};
