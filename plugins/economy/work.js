'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 30 * 60 * 1000;
const REWARD_MIN = 50;
const REWARD_MAX = 200;
const XP = 15;

const MSGS = [
  'Trabajaste como programador 💻',
  'Trabajaste como chef 👨‍🍳',
  'Trabajaste como doctor 🏥',
  'Trabajaste como conductor 🚗',
  'Trabajaste como profesor 📚',
  'Trabajaste como albañil 🏗️',
  'Trabajaste como vendedor 🛒',
  'Trabajaste como fontanero 🔧',
  'Trabajaste como bombero 🚒',
  'Trabajaste como piloto ✈️',
  'Trabajaste como mecánico 🔩',
  'Trabajaste como electricista ⚡',
];

export default {
  command: ['work', 'trabajar', 'trabajo'],
  category: 'economy',
  description: 'Trabaja para ganar dinero (30min)',
  cooldown: '30m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'workLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const msg = MSGS[Math.floor(Math.random() * MSGS.length)];
    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    checkCooldown(sender, 'workLast', COOLDOWN);
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n💼 *¡TRABAJO COMPLETADO!*\n${S.line}\n\n`;
    text += `${msg}\n\n`;
    text += `${S.money} Ganaste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n`;
    text += `${S.clock} Vuelve en: *30m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'workLast', COOLDOWN);
    if (remaining > 0) return null;
    const msg = MSGS[Math.floor(Math.random() * MSGS.length)];
    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    checkCooldown(ctx.sender, 'workLast', COOLDOWN);
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.hammer} *Work*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
