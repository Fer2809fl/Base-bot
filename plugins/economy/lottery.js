'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 60 * 60 * 1000;
const TICKET = 100;
const XP = 10;
const JACKPOT = 5000;

export default {
  command: ['lottery', 'loteria', 'lotto'],
  category: 'economy',
  description: 'Boleto de lotería ($100, 1h)',
  cooldown: '1h',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'lotteryLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < TICKET) {
      await sock.sendMessage(from, { text: `${S.error} Necesitas *${money(TICKET)}* para un boleto.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'lotteryLast', COOLDOWN);
    removeMoney(sender, TICKET);

    const nums = [];
    while (nums.length < 3) { const n = Math.floor(Math.random() * 10); if (!nums.includes(n)) nums.push(n); }
    nums.sort((a, b) => a - b);
    const winning = [];
    while (winning.length < 3) { const n = Math.floor(Math.random() * 10); if (!winning.includes(n)) winning.push(n); }
    winning.sort((a, b) => a - b);

    const matches = nums.filter((n) => winning.includes(n)).length;
    let prize = 0;
    if (matches === 3) prize = JACKPOT;
    else if (matches === 2) prize = 500;
    else if (matches === 1) prize = 150;

    if (prize > 0) addMoney(sender, prize);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🎰 *¡LOTERÍA!*\n${S.line}\n\n`;
    text += `${S.star} Tus: *${nums.join(' ')}*\n`;
    text += `${S.diamond} Ganadores: *${winning.join(' ')}*\n\n`;
    text += `${S.target} Coincidencias: *${matches}/3*\n`;
    text += prize > 0
      ? `${S.money} ¡Ganaste: *${money(prize)}*!`
      : `${S.skull} No ganaste.`;
    text += `\n${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *1h*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'lotteryLast', COOLDOWN);
    if (remaining > 0) return null;
    const user = getUser(ctx.sender);
    if (user.balance < TICKET) return null;
    checkCooldown(ctx.sender, 'lotteryLast', COOLDOWN);
    removeMoney(ctx.sender, TICKET);
    const nums = [];
    while (nums.length < 3) { const n = Math.floor(Math.random() * 10); if (!nums.includes(n)) nums.push(n); }
    const winning = [];
    while (winning.length < 3) { const n = Math.floor(Math.random() * 10); if (!winning.includes(n)) winning.push(n); }
    const matches = nums.filter((n) => winning.includes(n)).length;
    let prize = 0;
    if (matches === 3) prize = JACKPOT;
    else if (matches === 2) prize = 500;
    else if (matches === 1) prize = 150;
    if (prize > 0) addMoney(ctx.sender, prize);
    const lvl = addXp(ctx.sender, XP);
    return `${S.fire} *Lottery*: ${matches}/3 ${prize > 0 ? '+' + money(prize) : 'No ganaste'}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
