'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 15 * 60 * 1000;
const REWARD_MIN = 80;
const REWARD_MAX = 350;
const FINE_MIN = 50;
const FINE_MAX = 200;
const XP = 20;
const FAIL_CHANCE = 0.35;

const MSGS = [
  'Robaste un banco 🏦', 'Vendiste droga 💊', 'Estafaste a un turista 🧳',
  'Hackeaste una cuenta 💻', 'Vendiste información 📄', 'Lavaste dinero 🎰',
  'Robaste un camión 🚛', 'Vendiste autos 🚗', 'Fraude fiscal 📊',
];

const FAIL_MSGS = [
  'La policía te atrapó 🚔', 'El guardia te vio 👮', 'Te grabaron 📹',
];

export default {
  command: ['crime', 'crimen', 'robar2'],
  category: 'economy',
  description: 'Comete un crimen (15min, riesgo de multa)',
  cooldown: '15m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'crimeLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'crimeLast', COOLDOWN);

    if (Math.random() < FAIL_CHANCE) {
      const fine = Math.floor(Math.random() * (FINE_MAX - FINE_MIN + 1)) + FINE_MIN;
      const user = getUser(sender);
      const lost = Math.min(fine, user.balance);
      removeMoney(sender, lost);
      const msg = FAIL_MSGS[Math.floor(Math.random() * FAIL_MSGS.length)];

      let text = `${S.line}\n🚨 *¡CRIMEN FALLIDO!*\n${S.line}\n\n`;
      text += `${msg}\n\n`;
      text += `${S.minus} Multa: *-${money(lost)}*\n`;
      text += `${S.star2} +${Math.floor(XP / 2)} XP (por intentar)`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    const msg = MSGS[Math.floor(Math.random() * MSGS.length)];
    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🦹 *¡CRIMEN EXITOSO!*\n${S.line}\n\n`;
    text += `${msg}\n\n`;
    text += `${S.money} Ganaste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'crimeLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'crimeLast', COOLDOWN);

    if (Math.random() < FAIL_CHANCE) {
      const fine = Math.floor(Math.random() * (FINE_MAX - FINE_MIN + 1)) + FINE_MIN;
      const user = getUser(ctx.sender);
      const lost = Math.min(fine, user.balance);
      removeMoney(ctx.sender, lost);
      return `${S.skull} *Crime*: ❌ Falló (-${money(lost)})`;
    }

    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.skull} *Crime*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
