'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 20 * 60 * 1000;
const XP = 16;

const CROPS = [
  { name: 'Maíz 🌽', min: 30, max: 80 },
  { name: 'Trigo 🌾', min: 25, max: 70 },
  { name: 'Tomate 🍅', min: 35, max: 90 },
  { name: 'Papa 🥔', min: 20, max: 60 },
  { name: 'Sandía 🍉', min: 50, max: 130 },
  { name: 'Fresa 🍓', min: 40, max: 110 },
  { name: 'Uva 🍇', min: 60, max: 160 },
  { name: 'Café ☕', min: 70, max: 200 },
  { name: 'Plátano 🍌', min: 30, max: 85 },
];

export default {
  command: ['farm', 'cultivar', 'cosecha'],
  category: 'economy',
  description: 'Cultiva para ganar dinero (20min)',
  cooldown: '20m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'farmLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'farmLast', COOLDOWN);
    const crop = CROPS[Math.floor(Math.random() * CROPS.length)];
    const reward = Math.floor(Math.random() * (crop.max - crop.min + 1)) + crop.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🌾 *¡COSECHA!*\n${S.line}\n\n`;
    text += `${S.star} Cultivaste: *${crop.name}*\n`;
    text += `${S.money} Vendiste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *20m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'farmLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'farmLast', COOLDOWN);
    const crop = CROPS[Math.floor(Math.random() * CROPS.length)];
    const reward = Math.floor(Math.random() * (crop.max - crop.min + 1)) + crop.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.seed} *Farm*: ${crop.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
