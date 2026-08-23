'use strict';

import { sellProperty, addMoney, addXp, formatMoney } from '../../lib/database.js';

export default {
  command: ['sellprop', 'venderpropiedad', 'venderprop'],
  category: 'economy',
  description: 'Vende una propiedad (70% del precio)',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `❌ Uso: *.sellprop ID*\nEjemplo: *.sellprop cabaña*\n\nUsa *.props mias* para ver tus propiedades.` }, { quoted: m });
      return;
    }

    const propId = args[0].toLowerCase();
    const result = sellProperty(sender, propId);

    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    addMoney(sender, result.sellPrice);
    const lvl = addXp(sender, 15);

    let text = `💰 *¡Propiedad vendida!*\n\n`;
    text += `${result.property.emoji} *${result.property.name}*\n`;
    text += `💵 Recibiste: *$${formatMoney(result.sellPrice)}* (70% del precio)`;
    text += `\n\n⭐ +15 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
