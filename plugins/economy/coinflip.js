'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 2 * 60 * 1000;
const XP = 8;

export default {
  command: ['coinflip', 'cf', 'moneda', 'lanzar'],
  category: 'economy',
  description: 'Apuesta con una moneda (2min)',
  cooldown: '2m',
  run: async ({ sock, m, from, sender, args }) => {
    const remaining = getCooldownRemaining(sender, 'coinflipLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: `${S.info} Uso: *.cf cantidad cara*\nEjemplo: *.cf 100 cara*` }, { quoted: m });
      return;
    }

    const side = (args[1] || '').toLowerCase();
    if (!['cara', 'cruz', 'heads', 'tails'].includes(side)) {
      await sock.sendMessage(from, { text: `${S.info} Elige: *.cf cantidad cara* o *.cf cantidad cruz*` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < amount) {
      await sock.sendMessage(from, { text: `${S.error} No tienes suficiente dinero.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'coinflipLast', COOLDOWN);
    removeMoney(sender, amount);

    const result = Math.random() < 0.5 ? 'cara' : 'cruz';
    const choseCara = ['cara', 'heads'].includes(side);
    const won = (result === 'cara' && choseCara) || (result === 'cruz' && !choseCara);

    if (won) addMoney(sender, amount * 2);
    const lvl = addXp(sender, XP);

    const emoji = result === 'cara' ? '🪙' : '🔘';
    let text = `${S.line}\n${emoji} *¡MONEDA AL AIRE!*\n${S.line}\n\n`;
    text += `${S.star} Salió: *${result.toUpperCase()}*\n\n`;
    text += won
      ? `${S.money} ¡Ganaste: *${money(amount * 2)}*!`
      : `${S.minus} Perdiste: *-${money(amount)}*`;
    text += `\n${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *2m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'coinflipLast', COOLDOWN);
    if (remaining > 0) return null;
    const user = getUser(ctx.sender);
    const amount = Math.min(50, user.balance);
    if (amount <= 0) return null;
    checkCooldown(ctx.sender, 'coinflipLast', COOLDOWN);
    removeMoney(ctx.sender, amount);
    const result = Math.random() < 0.5 ? 'cara' : 'cruz';
    const won = Math.random() < 0.5;
    if (won) addMoney(ctx.sender, amount * 2);
    const lvl = addXp(ctx.sender, XP);
    return `${S.star} *CF*: ${result.toUpperCase()} ${won ? '+' + money(amount) : '-' + money(amount)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
