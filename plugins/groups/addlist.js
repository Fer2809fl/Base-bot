'use strict';

import { getGroupConfig, setGroupConfig } from '../../lib/database.js';

export default {
  command: ['addlist', 'delist', 'listresp', 'list'],
  category: 'grupo',
  description: 'Gestiona auto-respuestas del grupo',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args, command }) => {
    const config = getGroupConfig(from);
    if (!config.autoReplies) config.autoReplies = {};

    const sub = args[0]?.toLowerCase();

    if (command === 'addlist') {
      const [trigger, ...response] = args.slice(1);
      if (!trigger || response.length === 0) {
        return sock.sendMessage(from, { text: '📝 Uso: .addlist hola | Hola! Bienvenido' }, { quoted: m });
      }
      config.autoReplies[trigger.toLowerCase()] = response.join(' ');
      return sock.sendMessage(from, { text: `✅ Auto-respuesta creada:\n> *${trigger}* → ${response.join(' ')}` }, { quoted: m });
    }

    if (command === 'delist') {
      const trigger = args[1]?.toLowerCase();
      if (!trigger || !config.autoReplies[trigger]) {
        return sock.sendMessage(from, { text: '📝 Uso: .delist hola' }, { quoted: m });
      }
      delete config.autoReplies[trigger];
      return sock.sendMessage(from, { text: `✅ Auto-respuesta *${trigger}* eliminada.` }, { quoted: m });
    }

    const entries = Object.entries(config.autoReplies);
    if (entries.length === 0) {
      return sock.sendMessage(from, { text: 'ℹ️ No hay auto-respuestas.\n📝 Usa *.addlist trigger | respuesta*' }, { quoted: m });
    }

    const list = entries.map(([k, v]) => `> *${k}* → ${v}`).join('\n');
    await sock.sendMessage(from, { text: `📋 *Auto-respuestas:*\n\n${list}` }, { quoted: m });
  },
};
