'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 10 * 60 * 1000;
const XP = 10;

const WOODS = [
  { name: 'Pino 🌲', min: 20, max: 50 },
  { name: 'Roble 🌳', min: 40, max: 100 },
  { name: 'Cerezo 🌸', min: 50, max: 130 },
  { name: 'Nogal 🪵', min: 60, max: 150 },
  { name: 'Caoba 🟫', min: 80, max: 200 },
  { name: 'Ébano ⬛', min: 100, max: 280 },
  { name: 'Bambú 🎋', min: 30, max: 70 },
  { name: 'Madera podrida 🪳', min: 5, max: 15 },
];

export default {
  command: ['chop', 'talar', 'madera'],
  category: 'economy',
  description: 'Corta madera (10min)',
  cooldown: '10m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'chopLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'chopLast', COOLDOWN);
    const wood = WOODS[Math.floor(Math.random() * WOODS.length)];
    const reward = Math.floor(Math.random() * (wood.max - wood.min + 1)) + wood.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🪓 *¡TALA!*\n${S.line}\n\n`;
    text += `${S.star} Cortaste: *${wood.name}*\n`;
    text += `${S.money} Vale: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *10m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'chopLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'chopLast', COOLDOWN);
    const wood = WOODS[Math.floor(Math.random() * WOODS.length)];
    const reward = Math.floor(Math.random() * (wood.max - wood.min + 1)) + wood.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.hammer} *Chop*: ${wood.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
