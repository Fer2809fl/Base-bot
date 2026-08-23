'use strict';

import { getLevelLeaderboard, getUserPosition, getPositionReward, getSeasonInfo, getTopRewards, getUser, formatMoney } from '../../lib/database.js';
import { header, bullet, bulletSimple, money, time, barPercent, footer, S } from '../../lib/style.js';

let economyDb = null;

export default {
  command: ['levelrank', 'lr', 'niveles', 'topnivel'],
  category: 'economy',
  description: 'Ranking por nivel y recompensas de temporada',
  run: async ({ sock, m, from, sender }) => {
    if (!economyDb) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const dbPath = path.join(__dirname, '..', '..', 'economy.json');
        economyDb = JSON.parse(fs.default.readFileSync(dbPath, 'utf-8'));
      } catch { economyDb = { users: {} }; }
    }

    const season = getSeasonInfo();
    const top = getLevelLeaderboard(economyDb, 10);
    const position = getUserPosition(economyDb, sender);
    const posReward = position ? getPositionReward(position) : null;
    const topRewards = getTopRewards();

    let text = `${S.line}\n${S.crown} *RANKING POR NIVEL*\n${S.line}\n\n`;
    text += `${S.diamond} Temporada: *#${season.season}*\n`;
    text += `${S.clock} Termina en: *${time(season.timeLeft)}*\n\n`;

    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < top.length; i++) {
      const entry = top[i];
      const medal = medals[i] || `${S.dot}`;
      const you = entry.userId === sender ? ' ← *TÚ*' : '';
      text += `${medal} @${entry.userId.split('@')[0]}${you}\n`;
      text += `   ${S.star2} Nv.${entry.level} | ${S.money}${formatMoney(entry.total)}\n\n`;
    }

    text += `${S.lineThin}\n`;
    if (position) {
      text += `${S.star} Tu posición: *#${position}*`;
      if (posReward) text += ` ${posReward.emoji} ${posReward.title}`;
      text += `\n`;
    } else {
      text += `${S.star} Aún no estás en el top 15\n`;
    }

    text += `\n${S.section('RECOMPENSAS TOP 5')}\n`;
    for (const r of topRewards) {
      text += `${r.emoji} #${r.pos} - ${r.title} - *${money(r.reward)}*\n`;
    }

    text += `\n${S.lineThin}\n`;
    text += `${S.arrow} *.lr claim* - Reclamar recompensa de temporada`;
    text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    const mentions = top.map((e) => e.userId);
    await sock.sendMessage(from, { text, mentions }, { quoted: m });
  },
};
