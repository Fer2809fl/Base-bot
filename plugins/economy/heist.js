'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 60 * 60 * 1000;
const COST = 200;
const XP = 40;
const SUCCESS = 0.3;

const HEISTS = [
  { name: 'Banco Central 🏦', min: 500, max: 2000, fail: 300 },
  { name: 'Casa de joyería 💎', min: 300, max: 1500, fail: 200 },
  { name: 'Museo nacional 🏛️', min: 400, max: 1800, fail: 250 },
  { name: 'Residencia millonaria 🏰', min: 350, max: 1600, fail: 220 },
  { name: 'Depósito de seguridad 🔒', min: 600, max: 2500, fail: 400 },
];

export default {
  command: ['heist', 'asalto', 'golpe'],
  category: 'economy',
  description: 'Golpe grande (costo $200, 1h)',
  cooldown: '1h',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'heistLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < COST) {
      await sock.sendMessage(from, { text: `${S.error} Necesitas *${money(COST)}* para el equipo.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'heistLast', COOLDOWN);
    removeMoney(sender, COST);
    const heist = HEISTS[Math.floor(Math.random() * HEISTS.length)];

    if (Math.random() < SUCCESS) {
      const reward = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
      addMoney(sender, reward);
      const lvl = addXp(sender, XP);
      let text = `${S.line}\n🏧 *¡GOLPE EXITOSO!*\n${S.line}\n\n`;
      text += `${S.star} Asaltaste: *${heist.name}*\n`;
      text += `${S.money} Ganaste: *${money(reward)}*\n`;
      text += `${S.star2} +${XP} XP`;
      if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
    } else {
      const fine = Math.min(heist.fail, user.balance);
      removeMoney(sender, fine);
      let text = `${S.line}\n🚨 *¡GOLPE FALLIDO!*\n${S.line}\n\n`;
      text += `${S.star} Asaltaste: *${heist.name}*\n`;
      text += `${S.minus} Multa: *-${money(fine)}*\n`;
      text += `${S.star2} +${Math.floor(XP / 2)} XP`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
    }
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'heistLast', COOLDOWN);
    if (remaining > 0) return null;
    const user = getUser(ctx.sender);
    if (user.balance < COST) return null;
    checkCooldown(ctx.sender, 'heistLast', COOLDOWN);
    removeMoney(ctx.sender, COST);
    const heist = HEISTS[Math.floor(Math.random() * HEISTS.length)];
    if (Math.random() < SUCCESS) {
      const reward = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
      addMoney(ctx.sender, reward);
      const lvl = addXp(ctx.sender, XP);
      return `${S.trophy} *Heist*: ¡Éxito! +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
    }
    return `${S.skull} *Heist*: ❌ Falló (-${money(COST)})`;
  },
};
