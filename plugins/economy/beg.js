'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 5 * 60 * 1000;
const XP = 5;

const MSGS = [
  { text: 'Un anciano te dio dinero 👴', min: 10, max: 50 },
  { text: 'Un señor generoso te dio monedas 💵', min: 20, max: 80 },
  { text: 'Una señora te dio pan 🍞', min: 5, max: 20 },
  { text: 'Un niño te dio su cambio 🪙', min: 15, max: 40 },
  { text: 'Nadie te hizo caso 😢', min: 0, max: 5 },
  { text: 'Un turista te dio dólares 🇺🇸', min: 50, max: 150 },
  { text: 'Te patearon 👢', min: -50, max: -10 },
  { text: 'Un músico te dio propina 🎵', min: 25, max: 70 },
  { text: 'Encontraste monedas 🪙', min: 3, max: 12 },
];

export default {
  command: ['beg', 'mendigar', 'pedir'],
  category: 'economy',
  description: 'Mendiga para ganar dinero (5min)',
  cooldown: '5m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'begLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'begLast', COOLDOWN);
    const pick = MSGS[Math.floor(Math.random() * MSGS.length)];
    const reward = Math.floor(Math.random() * (pick.max - pick.min + 1)) + pick.min;
    if (reward > 0) addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🥺 *MENDIGANDO...*\n${S.line}\n\n`;
    text += `${pick.text}\n\n`;
    text += reward >= 0
      ? `${S.money} Ganaste: *${money(reward)}*\n`
      : `${S.minus} Perdiste: *-${money(Math.abs(reward))}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *5m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'begLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'begLast', COOLDOWN);
    const pick = MSGS[Math.floor(Math.random() * MSGS.length)];
    const reward = Math.floor(Math.random() * (pick.max - pick.min + 1)) + pick.min;
    if (reward > 0) addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.heart} *Beg*: ${reward >= 0 ? '+' + money(reward) : '-' + money(Math.abs(reward))}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
