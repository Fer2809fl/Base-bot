'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 10 * 60 * 1000;
const XP = 10;

const FINDS = [
  { name: 'Monedas antiguas 🪙', min: 30, max: 80 },
  { name: 'Cofre enterrado 📦', min: 80, max: 250 },
  { name: 'Amuleto dorado 📿', min: 100, max: 300 },
  { name: 'Frasco de rubíes 🧪', min: 150, max: 400 },
  { name: 'Anillo antiguo 💍', min: 120, max: 350 },
  { name: 'Gema ancestral 💠', min: 200, max: 500 },
  { name: 'Huesos 🦴', min: 5, max: 15 },
  { name: 'Botella vieja 🍾', min: 10, max: 30 },
];

export default {
  command: ['dig', 'cavar', 'excavar'],
  category: 'economy',
  description: 'Cava para encontrar tesoros (10min)',
  cooldown: '10m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'digLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'digLast', COOLDOWN);
    const find = FINDS[Math.floor(Math.random() * FINDS.length)];
    const reward = Math.floor(Math.random() * (find.max - find.min + 1)) + find.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🕳️ *¡CAVANDO!*\n${S.line}\n\n`;
    text += `${S.star} Encontraste: *${find.name}*\n`;
    text += `${S.money} Vale: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *10m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'digLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'digLast', COOLDOWN);
    const find = FINDS[Math.floor(Math.random() * FINDS.length)];
    const reward = Math.floor(Math.random() * (find.max - find.min + 1)) + find.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.target} *Dig*: ${find.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
