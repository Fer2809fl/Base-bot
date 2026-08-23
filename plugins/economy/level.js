'use strict';

import { getUser, formatMoney, xpForLevel } from '../../lib/database.js';
import { header, bullet, bulletSimple, barPercent, money, footer, S } from '../../lib/style.js';

export default {
  command: ['level', 'lvl', 'xp', 'nivel'],
  category: 'economy',
  description: 'Consulta tu nivel y XP',
  run: async ({ sock, m, from, sender, args }) => {
    const targetId = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
    const user = getUser(targetId);
    const isSelf = targetId === sender;
    const mention = isSelf ? 'Tu' : `De @${targetId.split('@')[0]}`;

    const level = user.level || 1;
    const xp = user.xp || 0;
    const needed = xpForLevel(level);

    let text = `${S.line}\n${S.star2} *NIVEL ${mention.toUpperCase()}*\n${S.line}\n\n`;
    text += `${S.diamond} Nivel: *${level}*\n`;
    text += `${S.star3} XP: *${barPercent(xp, needed, 12)}*\n`;
    text += `${S.lineThin}\n`;
    text += `${S.star} Wallet: *${money(user.balance || 0)}*\n`;
    text += `${S.diamond} Banco: *${money(user.bank || 0)}*\n`;
    text += `${S.trophy} Total: *${money((user.balance || 0) + (user.bank || 0))}*\n`;
    text += `${S.lineThin}\n`;
    text += `${S.sword} Duelos: *${user.duelsWon || 0}W / ${user.duelsLost || 0}L*\n`;
    text += `\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
  },
};
