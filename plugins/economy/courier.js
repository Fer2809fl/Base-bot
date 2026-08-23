'use strict';

import { addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 12 * 60 * 1000;
const XP = 14;

const PACKAGES = [
  { text: 'Entregaste un paquete de Amazon 📦', min: 40, max: 100 },
  { text: 'Entregaste un paquete urgente ⚡', min: 60, max: 160 },
  { text: 'Entregaste un regalo 🎁', min: 30, max: 80 },
  { text: 'Entregaste documentos 📄', min: 50, max: 130 },
  { text: 'Entregaste un paquete internacional 🌎', min: 80, max: 220 },
  { text: 'El paquete estaba vacío 📭', min: 5, max: 15 },
  { text: 'Entregaste un paquete de lujo 👜', min: 100, max: 300 },
  { text: 'Se te cayó el paquete 💀', min: 0, max: 10 },
];

export default {
  command: ['courier', 'deliver', 'paquete'],
  category: 'economy',
  description: 'Entrega paquetes (12min)',
  cooldown: '12m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'courierLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'courierLast', COOLDOWN);
    const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
    const reward = Math.floor(Math.random() * (pkg.max - pkg.min + 1)) + pkg.min;
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${S.line}\n📦 *¡ENTREGA!*\n${S.line}\n\n`;
    text += `${pkg.text}\n\n`;
    text += `${S.money} Ganaste: *${money(reward)}*\n`;
    text += `${S.star2} +${XP} XP`;
    if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    text += `\n\n${S.lineThin}\n${S.clock} Vuelve en: *12m*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'courierLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'courierLast', COOLDOWN);
    const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
    const reward = Math.floor(Math.random() * (pkg.max - pkg.min + 1)) + pkg.min;
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `${S.box} *Courier*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
