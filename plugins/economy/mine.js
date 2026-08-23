'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 15 * 60 * 1000;
const XP = 18;

const MINERALS = [
  { name: 'Piedra 🪨', min: 15, max: 40 },
  { name: 'Carbón ⬛', min: 25, max: 60 },
  { name: 'Copper 🟤', min: 40, max: 90 },
  { name: 'Hierro ⚙️', min: 60, max: 140 },
  { name: 'Oro 🥇', min: 100, max: 250 },
  { name: 'Diamante 💎', min: 200, max: 500 },
  { name: 'Esmeralda 💚', min: 150, max: 400 },
  { name: 'Plata 🥈', min: 50, max: 120 },
  { name: 'Nada 😢', min: 0, max: 5 },
];

export default {
  command: ['mine', 'minar', 'mineria'],
  category: 'economy',
  description: 'Mina minerales (15min)',
  cooldown: '15m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'mineLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'mineLast', COOLDOWN);
    const mineral = MINERALS[Math.floor(Math.random() * MINERALS.length)];
    const reward = Math.floor(Math.random() * (mineral.max - mineral.min + 1)) + mineral.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n⛏️ *¡MINERÍA!*\n${S.line}\n\n`;
    text += `${S.star} Encontraste: *${mineral.name}*\n`;
    text += `${S.money} Vale: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *15m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'mineLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'mineLast', COOLDOWN);
    const mineral = MINERALS[Math.floor(Math.random() * MINERALS.length)];
    const reward = Math.floor(Math.random() * (mineral.max - mineral.min + 1)) + mineral.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.hammer} *Mine*: ${mineral.name} +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
