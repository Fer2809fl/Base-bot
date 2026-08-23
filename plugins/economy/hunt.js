'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 10 * 60 * 1000;
const XP = 14;

const ANIMALS = [
  { name: 'Conejo 🐇', min: 20, max: 50 },
  { name: 'Pato 🦆', min: 25, max: 60 },
  { name: 'Venado 🦌', min: 80, max: 200 },
  { name: 'Jabalí 🐗', min: 60, max: 150 },
  { name: 'Oso 🐻', min: 150, max: 350 },
  { name: 'Lobo 🐺', min: 100, max: 250 },
  { name: 'Águila 🦅', min: 120, max: 280 },
  { name: 'Puma 🐆', min: 130, max: 300 },
  { name: 'Rana 🐸', min: 5, max: 15 },
];

export default {
  command: ['hunt', 'cazar', 'caza'],
  category: 'economy',
  description: 'Caza animales (10min)',
  cooldown: '10m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'huntLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'huntLast', COOLDOWN);
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const reward = Math.floor(Math.random() * (animal.max - animal.min + 1)) + animal.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🏹 *¡CAZA EXITOSA!*\n${S.line}\n\n`;
    text += `${S.star} Cazaste: *${animal.name}*\n`;
    text += `${S.money} Vale: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *10m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'huntLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'huntLast', COOLDOWN);
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const reward = Math.floor(Math.random() * (animal.max - animal.min + 1)) + animal.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.sword} *Hunt*: ${animal.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
