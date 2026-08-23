'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['unmute', 'desmutear'],
  category: 'grupo',
  description: 'Desmutea a un usuario',
  group: true,
  botAdmin: true,
  admin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .unmute @usuario' }, { quoted: m });

    const config = getGroupConfig(from);
    if (!config.mutedUsers) config.mutedUsers = [];
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetKey = extractNum(target);

    const index = config.mutedUsers.indexOf(targetKey);
    if (index === -1) {
      return sock.sendMessage(from, { text: `ℹ️ @${targetKey} no está muteado.`, mentions: [target] }, { quoted: m });
    }

    config.mutedUsers.splice(index, 1);
    await sock.sendMessage(from, { text: `🔊 @${targetKey} desmuteado.`, mentions: [target] }, { quoted: m });
  },
};
