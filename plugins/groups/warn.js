'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['warn', 'advertir'],
  category: 'grupo',
  description: 'Advierte a un usuario (3 = expulsión)',
  group: true,
  botAdmin: true,
  admin: true,
  argsRequired: true,
  usage: 'Uso: .warn @usuario [razón]',
  run: async ({ sock, m, from, sender, target, args }) => {
    if (!target) return sock.sendMessage(from, { text: '📝 Uso: .warn @usuario [razón]' }, { quoted: m });

    const config = getGroupConfig(from);
    if (!config.warnings) config.warnings = {};
    const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
    const targetKey = extractNum(target);

    if (!config.warnings[targetKey]) config.warnings[targetKey] = [];
    config.warnings[targetKey].push({ by: sender, reason: args.slice(1).join(' ') || 'Sin razón', date: Date.now() });
    const count = config.warnings[targetKey].length;

    if (count >= 3) {
      try {
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        config.warnings[targetKey] = [];
        await sock.sendMessage(from, { text: `🚫 @${targetKey} expulsado por 3 warnings.`, mentions: [target] }, { quoted: m });
      } catch (err) {
        await sock.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: m });
      }
    } else {
      await sock.sendMessage(from, {
        text: `⚠️ @${targetKey} advertido (${count}/3)\n📝 ${args.slice(1).join(' ') || 'Sin razón'}`,
        mentions: [target],
      }, { quoted: m });
    }
  },
};
