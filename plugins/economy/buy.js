'use strict';

import { buyItem, getItem, getUser, removeMoney, addXp, formatMoney } from '../../lib/database.js';

export default {
  command: ['buy', 'comprar', 'shopbuy'],
  category: 'economy',
  description: 'Compra un item de la tienda',
  cooldown: '1s',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `❌ Uso: *.buy ID*\nEjemplo: *.buy xpboost2x*\n\nUsa *.shop* para ver los items disponibles.` }, { quoted: m });
      return;
    }

    const itemId = args[0].toLowerCase();
    const item = getItem(itemId);
    if (!item) {
      await sock.sendMessage(from, { text: `❌ Item "${itemId}" no encontrado.\nUsa *.shop* para ver los disponibles.` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    const hasVipItem = (await import('../../lib/shop.js')).isVip(sender);
    const price = hasVipItem ? Math.floor(item.price * 0.8) : item.price;

    if (user.balance < price) {
      await sock.sendMessage(from, { text: `❌ Necesitas *$${formatMoney(price)}* pero solo tienes *$${formatMoney(user.balance)}*` }, { quoted: m });
      return;
    }

    const result = buyItem(sender, itemId);
    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    removeMoney(sender, result.finalPrice);
    const lvl = addXp(sender, 10);

    let text = `🛒 *¡Compra exitosa!*\n\n`;
    text += `${item.emoji} *${item.name}*\n`;
    text += `💰 Pagaste: *$${formatMoney(result.finalPrice)}*`;
    if (result.hasVip) text += `\n👑 Descuento VIP aplicado (-20%)`;
    text += `\n📝 ${item.description}`;
    if (item.duration > 0) {
      const mins = Math.floor(item.duration / 60000);
      text += `\n⏱️ Duración: ${mins} minutos`;
    }
    text += `\n⭐ +10 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
