'use strict';

import { getLeaderboard, getLevelLeaderboard, formatMoney } from '../../lib/database.js';
import { header, bullet, money, footer, S } from '../../lib/style.js';

export default {
  command: ['lb', 'leaderboard', 'ranking', 'top', 'ricos'],
  category: 'economy',
  description: 'Ranking de los usuarios más ricos',
  run: async ({ sock, m, from, sender }) => {
    const top = getLeaderboard(10);
    if (top.length === 0) {
      await sock.sendMessage(from, { text: `${S.info} No hay datos aún.` }, { quoted: m });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    let text = `${S.line}\n${S.trophy} *RANKING DE RICOS*\n${S.line}\n\n`;

    top.forEach((entry, i) => {
      const medal = medals[i] || `${S.dot}`;
      const you = entry.userId === sender ? ' ← *TÚ*' : '';
      text += `${medal} @${entry.userId.split('@')[0]}${you}\n`;
      text += `   ${S.money} *${money(entry.total)}* | ⭐ Nv.${entry.level}\n\n`;
    });

    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text, mentions: top.map((e) => e.userId) }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const top = getLeaderboard(3);
    if (top.length === 0) return `${S.info} Sin datos`;
    const medals = ['🥇', '🥈', '🥉'];
    return top.map((e, i) => `${medals[i]} @${e.userId.split('@')[0]} ${money(e.total)}`).join(' | ');
  },
};
