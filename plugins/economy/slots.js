'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 10 * 60 * 1000;
const XP = 10;
const BET = 50;
const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔', '⭐'];

export default {
  command: ['slots', 'slot', 'tragamonedas', 'casino'],
  category: 'economy',
  description: 'Tragamonedas (apuesta $50, 10min)',
  cooldown: '10m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'slotsLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < BET) {
      await sock.sendMessage(from, { text: `${S.error} Necesitas al menos *${money(BET)}* para jugar.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'slotsLast', COOLDOWN);
    removeMoney(sender, BET);

    const s1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const s2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const s3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    let mult = 0;
    if (s1 === s2 && s2 === s3) mult = s1 === '💎' ? 10 : s1 === '7️⃣' ? 8 : 5;
    else if (s1 === s2 || s2 === s3 || s1 === s3) mult = 2;

    const winnings = BET * mult;
    if (winnings > 0) addMoney(sender, winnings);
    const lvl = addXp(sender, XP);

    const display = `「${s1}」「${s2}」「${s3}」`;
    let text = `${S.line}\n🎰 *¡TRAGAMONEDAS!*\n${S.line}\n\n`;
    text += `*${display}*\n\n`;

    if (mult >= 5) {
      text += `${S.fire} ¡*JACKPOT*! x${mult}\n`;
      text += `${S.money} Ganaste: *${money(winnings)}*\n`;
    } else if (mult === 2) {
      text += `${S.star3} ¡Dos iguales! x2\n`;
      text += `${S.money} Ganaste: *${money(winnings)}*\n`;
    } else {
      text += `${S.skull} No salió nada\n`;
      text += `${S.minus} Perdiste: *-${money(BET)}*\n`;
    }

    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *10m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'slotsLast', COOLDOWN);
    if (remaining > 0) return null;
    const user = getUser(ctx.sender);
    if (user.balance < BET) return null;
    checkCooldown(ctx.sender, 'slotsLast', COOLDOWN);
    removeMoney(ctx.sender, BET);
    const s1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const s2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const s3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    let mult = 0;
    if (s1 === s2 && s2 === s3) mult = s1 === '💎' ? 10 : s1 === '7️⃣' ? 8 : 5;
    else if (s1 === s2 || s2 === s3 || s1 === s3) mult = 2;
    const winnings = BET * mult;
    if (winnings > 0) addMoney(ctx.sender, winnings);
    const lvl = addXp(ctx.sender, XP);
    return `${S.fire} *Slots*: [${s1}${s2}${s3}] ${mult > 0 ? '+' + money(winnings) + ' x' + mult : '-' + money(BET)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
