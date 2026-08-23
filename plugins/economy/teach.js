'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 25 * 60 * 1000;
const XP = 20;

const CLASSES = [
  { text: 'Diste clase de matemáticas ➗', min: 60, max: 150 },
  { text: 'Diste clase de programación 💻', min: 80, max: 200 },
  { text: 'Diste clase de historia 📜', min: 50, max: 120 },
  { text: 'Diste clase de ciencias 🔬', min: 70, max: 180 },
  { text: 'Diste clase de inglés 🇬🇧', min: 65, max: 160 },
  { text: 'Diste clase de música 🎵', min: 55, max: 140 },
  { text: 'Diste clase de arte 🎨', min: 45, max: 110 },
  { text: 'Los students se durmieron 😴', min: 5, max: 20 },
];

export default {
  command: ['teach', 'enseñar', 'clase'],
  category: 'economy',
  description: 'Da clases (25min)',
  cooldown: '25m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'teachLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'teachLast', COOLDOWN);
    const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const reward = Math.floor(Math.random() * (cls.max - cls.min + 1)) + cls.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n📚 *¡CLASE DADA!*\n${S.line}\n\n`;
    text += `${cls.text}\n\n`;
    text += `${S.money} Ganaste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *25m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'teachLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'teachLast', COOLDOWN);
    const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const reward = Math.floor(Math.random() * (cls.max - cls.min + 1)) + cls.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.star} *Teach*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
