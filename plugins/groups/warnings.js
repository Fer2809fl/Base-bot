'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['warnings', 'verwarns'],
  category: 'grupo',
  description: 'Muestra warnings de un usuario',
  group: true,
  run: async ({ sock, m, from, target }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .warnings @usuario' }, { quoted: m });

    const config = getGroupConfig(from);
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetKey = extractNum(target);
    const warns = config.warnings?.[targetKey] || [];

    if (warns.length === 0) {
      return sock.sendMessage(from, { text: `✅ @${targetKey} sin warnings.`, mentions: [target] }, { quoted: m });
    }

    const list = warns.map((w, i) => `${i + 1}. ${w.reason}`).join('\n');
    await sock.sendMessage(from, { text: `⚠️ *Warnings @${targetKey}:* (${warns.length}/3)\n\n${list}`, mentions: [target] }, { quoted: m });
  },
};
