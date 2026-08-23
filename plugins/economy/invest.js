'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 60 * 60 * 1000;
const XP = 20;
const MIN = 100;

export default {
  command: ['invest', 'inversion', 'invertir'],
  category: 'economy',
  description: 'Invierte dinero con riesgo (1h)',
  cooldown: '1h',
  run: async ({ sock, m, from, sender, args }) => {
    const remaining = getCooldownRemaining(sender, 'investLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const amount = args[0] === 'all' ? getUser(sender).balance : parseInt(args[0]);
    if (!amount || amount < MIN) {
      await sock.sendMessage(from, { text: `${S.info} Mínimo: *${money(MIN)}*\nUso: *.invest cantidad*` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < amount) {
      await sock.sendMessage(from, { text: `${S.error} No tienes suficiente dinero.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'investLast', COOLDOWN);
    removeMoney(sender, amount);

    const roll = Math.random();
    let mult;
    if (roll < 0.05) mult = 3.0;
    else if (roll < 0.20) mult = 1.5;
    else if (roll < 0.55) mult = 1.2;
    else if (roll < 0.75) mult = 0.8;
    else if (roll < 0.92) mult = 0.5;
    else mult = 0.0;

    const profit = Math.floor(amount * mult);
    addMoney(sender, profit);
    const lvl = addXp(sender, XP);

    const diff = profit - amount;
    let text = `${S.line}\n📈 *¡INVERSIÓN!*\n${S.line}\n\n`;
    text += `${S.diamond} Invertiste: *${money(amount)}*\n`;
    text += diff >= 0
      ? `${S.money} Ganancia: *+${money(diff)}* (x${mult})`
      : `${S.minus} Pérdida: *-${money(Math.abs(diff))}* (x${mult})`;
    text += `\n${S.target} Resultado: *${money(profit)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *1h*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'investLast', COOLDOWN);
    if (remaining > 0) return null;
    const user = getUser(ctx.sender);
    const amount = Math.min(200, user.balance);
    if (amount < MIN) return null;
    checkCooldown(ctx.sender, 'investLast', COOLDOWN);
    removeMoney(ctx.sender, amount);
    const roll = Math.random();
    let mult;
    if (roll < 0.05) mult = 3.0;
    else if (roll < 0.20) mult = 1.5;
    else if (roll < 0.55) mult = 1.2;
    else if (roll < 0.75) mult = 0.8;
    else if (roll < 0.92) mult = 0.5;
    else mult = 0.0;
    const profit = Math.floor(amount * mult);
    addMoney(ctx.sender, profit);
    const lvl = addXp(ctx.sender, XP);
    const diff = profit - amount;
    return `${S.target} *Invest*: ${diff >= 0 ? '+' + money(diff) : '-' + money(Math.abs(diff))} (x${mult})${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
