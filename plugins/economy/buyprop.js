'use strict';

import { buyProperty, getProperty, getUser, removeMoney, addXp, formatMoney } from '../../lib/database.js';

export default {
  command: ['buyprop', 'comprarcasa', 'comprarprop'],
  category: 'economy',
  description: 'Compra una propiedad (casa, auto, negocio)',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `❌ Uso: *.buyprop ID*\nEjemplo: *.buyprop cabaña*\n\nUsa *.props* para ver las disponibles.` }, { quoted: m });
      return;
    }

    const propId = args[0].toLowerCase();
    const prop = getProperty(propId);
    if (!prop) {
      await sock.sendMessage(from, { text: `❌ Propiedad "${propId}" no encontrada.\nUsa *.props* para ver las disponibles.` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < prop.price) {
      await sock.sendMessage(from, { text: `❌ Necesitas *$${formatMoney(prop.price)}* pero solo tienes *$${formatMoney(user.balance)}*` }, { quoted: m });
      return;
    }

    const result = buyProperty(sender, propId);
    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    removeMoney(sender, prop.price);
    const lvl = addXp(sender, 30);

    let text = `🏠 *¡Propiedad comprada!*\n\n`;
    text += `${prop.emoji} *${prop.name}*\n`;
    text += `💰 Pagaste: *$${formatMoney(prop.price)}*\n`;
    text += `💵 Renta: *$${formatMoney(prop.rent)}/hora*\n`;
    text += `📝 ${prop.description}`;
    text += `\n\n⭐ +30 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
