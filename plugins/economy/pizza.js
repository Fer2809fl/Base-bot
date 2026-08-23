'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 8 * 60 * 1000;
const XP = 12;

const DELIVERIES = [
  { text: 'Entregaste pizza a una fiesta 🎉', min: 30, max: 80 },
  { text: 'Entregaste pizza a un hospital 🏥', min: 40, max: 100 },
  { text: 'Entregaste pizza a una oficina 🏢', min: 35, max: 90 },
  { text: 'Entregaste pizza a una universidad 🎓', min: 25, max: 70 },
  { text: 'Entregaste pizza a la policía 🚔', min: 50, max: 120 },
  { text: 'Te perdiste y la pizza se enfrió ❄️', min: 5, max: 15 },
  { text: 'Entregaste pizza a un millonario 💰', min: 80, max: 250 },
  { text: 'Entregaste pizza en 5 min ⚡', min: 60, max: 150 },
];

export default {
  command: ['pizza', 'entregar'],
  category: 'economy',
  description: 'Entrega pizzas (8min)',
  cooldown: '8m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'pizzaLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'pizzaLast', COOLDOWN);
    const delivery = DELIVERIES[Math.floor(Math.random() * DELIVERIES.length)];
    const reward = Math.floor(Math.random() * (delivery.max - delivery.min + 1)) + delivery.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n🍕 *¡ENTREGA DE PIZZA!*\n${S.line}\n\n`;
    text += `${delivery.text}\n\n`;
    text += `${S.money} Ganaste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *8m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'pizzaLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'pizzaLast', COOLDOWN);
    const delivery = DELIVERIES[Math.floor(Math.random() * DELIVERIES.length)];
    const reward = Math.floor(Math.random() * (delivery.max - delivery.min + 1)) + delivery.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.box} *Pizza*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
