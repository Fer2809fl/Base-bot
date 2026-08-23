'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['unwarn', 'quitarwarn'],
  category: 'grupo',
  description: 'Quita un warning',
  group: true,
  admin: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .unwarn @usuario' }, { quoted: m });

    const config = getGroupConfig(from);
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetKey = extractNum(target);

    if (!config.warnings?.[targetKey]?.length) {
      return sock.sendMessage(from, { text: `✅ @${targetKey} sin warnings.`, mentions: [target] }, { quoted: m });
    }

    config.warnings[targetKey].pop();
    await sock.sendMessage(from, { text: `✅ @${targetKey} ahora tiene ${config.warnings[targetKey].length}/3 warnings.`, mentions: [target] }, { quoted: m });
  },
};
