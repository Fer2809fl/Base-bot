'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['mute', 'silenciar'],
  category: 'grupo',
  description: 'Silencia a un usuario',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .mute @usuario' }, { quoted: m });

    const config = getGroupConfig(from);
    if (!config.mutedUsers) config.mutedUsers = [];
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetKey = extractNum(target);

    if (config.mutedUsers.includes(targetKey)) {
      return sock.sendMessage(from, { text: `ℹ️ @${targetKey} ya está muteado.`, mentions: [target] }, { quoted: m });
    }

    config.mutedUsers.push(targetKey);
    await sock.sendMessage(from, { text: `🔇 @${targetKey} silenciado.`, mentions: [target] }, { quoted: m });
  },
};
