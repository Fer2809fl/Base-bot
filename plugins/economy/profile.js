'use strict';

import { getUser, formatMoney, formatCooldown, getCooldownRemaining, xpForLevel, getVipInfo, getTitle } from '../../lib/database.js';
import { header, bullet, bulletSimple, barPercent, money, time, footer, S } from '../../lib/style.js';

const ALL_COOLDOWNS = [
  { key: 'dailyLast', ms: 24 * 60 * 60 * 1000, label: '📅 Daily' },
  { key: 'workLast', ms: 30 * 60 * 1000, label: '💼 Work' },
  { key: 'crimeLast', ms: 15 * 60 * 1000, label: '🦹 Crime' },
  { key: 'fishLast', ms: 10 * 60 * 1000, label: '🎣 Fish' },
  { key: 'mineLast', ms: 15 * 60 * 1000, label: '⛏️ Mine' },
  { key: 'huntLast', ms: 10 * 60 * 1000, label: '🏹 Hunt' },
  { key: 'begLast', ms: 5 * 60 * 1000, label: '🥺 Beg' },
  { key: 'slotsLast', ms: 10 * 60 * 1000, label: '🎰 Slots' },
  { key: 'coinflipLast', ms: 2 * 60 * 1000, label: '🪙 Coinflip' },
  { key: 'lotteryLast', ms: 60 * 60 * 1000, label: '🎰 Lottery' },
  { key: 'heistLast', ms: 60 * 60 * 1000, label: '🏧 Heist' },
  { key: 'farmLast', ms: 20 * 60 * 1000, label: '🌾 Farm' },
  { key: 'duelLast', ms: 15 * 60 * 1000, label: '⚔️ Duel' },
  { key: 'chopLast', ms: 10 * 60 * 1000, label: '🪓 Chop' },
  { key: 'digLast', ms: 10 * 60 * 1000, label: '🕳️ Dig' },
  { key: 'pizzaLast', ms: 8 * 60 * 1000, label: '🍕 Pizza' },
  { key: 'courierLast', ms: 12 * 60 * 1000, label: '📦 Courier' },
  { key: 'teachLast', ms: 25 * 60 * 1000, label: '📚 Teach' },
  { key: 'investLast', ms: 60 * 60 * 1000, label: '📈 Invest' },
];

export default {
  command: ['profile', 'perfil', 'stat', 'stats'],
  category: 'economy',
  description: 'Tu perfil completo con cooldowns',
  run: async ({ sock, m, from, sender, args }) => {
    const targetId = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
    const user = getUser(targetId);
    const isSelf = targetId === sender;
    const mention = isSelf ? 'Tu' : `@${targetId.split('@')[0]}`;
    const title = getTitle(targetId);
    const vipInfo = getVipInfo(targetId);

    const level = user.level || 1;
    const xp = user.xp || 0;
    const needed = xpForLevel(level);

    let text = `${S.line}\n${S.crown} *PERFIL ${mention.toUpperCase()}*\n${S.line}\n\n`;
    text += `${S.diamond} Nivel: *${level}*\n`;
    text += `${S.star3} XP: *${barPercent(xp, needed, 12)}*\n`;
    if (title) text += `${S.crown} Título: *${title}*\n`;
    if (vipInfo) text += `${S.gem} VIP: *${vipInfo.name}*\n`;
    text += `\n${S.lineThin}\n`;
    text += `${S.star} Wallet: *${money(user.balance || 0)}*\n`;
    text += `${S.diamond} Banco: *${money(user.bank || 0)}*\n`;
    text += `${S.trophy} Total: *${money((user.balance || 0) + (user.bank || 0))}*\n`;
    text += `${S.target} Ganado: *${money(user.totalEarned || 0)}*\n`;
    text += `${S.lineThin}\n`;
    text += `${S.sword} Duelos: *${user.duelsWon || 0}W / ${user.duelsLost || 0}L*\n`;
    text += `\n${S.sectionDot('COOLDOWNS')}\n`;

    for (const cd of ALL_COOLDOWNS) {
      const remaining = getCooldownRemaining(targetId, cd.key, cd.ms);
      text += `${remaining > 0 ? S.lock : S.unlock} ${cd.label}: ${remaining > 0 ? time(remaining) : '✅'}\n`;
    }

    text += `\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
  },
};
