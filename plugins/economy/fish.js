'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 10 * 60 * 1000;
const XP = 12;

const FISH = [
  { name: 'Sardina 🐟', min: 20, max: 60 },
  { name: 'Atún 🐠', min: 50, max: 120 },
  { name: 'Salmón 🍣', min: 80, max: 180 },
  { name: 'Pez espada 🗡️', min: 100, max: 250 },
  { name: 'Langosta 🦞', min: 120, max: 300 },
  { name: 'Pez globo 🎈', min: 10, max: 30 },
  { name: 'Calamar 🦑', min: 40, max: 90 },
  { name: 'Tortuga 🐢', min: 150, max: 350 },
  { name: 'Basura 🗑️', min: 0, max: 5 },
];

export default {
  command: ['fish', 'pescar', 'pesca'],
  category: 'economy',
  description: 'Ve a pescar (10min)',
  cooldown: '10m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'fishLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'fishLast', COOLDOWN);
    const catch2 = FISH[Math.floor(Math.random() * FISH.length)];
    const reward = Math.floor(Math.random() * (catch2.max - catch2.min + 1)) + catch2.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🎣 *¡PESCA EXITOSA!*\n${S.line}\n\n`;
    text += `${S.star} Pescaste: *${catch2.name}*\n`;
    text += `${S.money} Vale: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *10m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'fishLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'fishLast', COOLDOWN);
    const catch2 = FISH[Math.floor(Math.random() * FISH.length)];
    const reward = Math.floor(Math.random() * (catch2.max - catch2.min + 1)) + catch2.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.sword} *Fish*: ${catch2.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
