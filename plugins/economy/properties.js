'use strict';

import { getPropsCatalog, getProperties, getTotalRentPerHour, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';

export default {
  command: ['props', 'propiedades', 'casas', 'properties'],
  category: 'economy',
  description: 'Ve propiedades disponibles o las tuyas',
  run: async ({ sock, m, from, sender, args }) => {
    const category = args[0]?.toLowerCase() || null;
    const categories = ['houses', 'vehicles', 'businesses'];
    const categoryNames = { houses: '🏠 Casas', vehicles: '🚗 Vehículos', businesses: '💼 Negocios' };

    // Si pide una categoría específica
    if (category && categories.includes(category)) {
      const items = getPropsCatalog(category);
      let text = `${categoryNames[category]} *Disponibles*\n\n`;

      for (const item of items) {
        text += `${item.emoji} *${item.name}*\n`;
        text += `   💰 $${formatMoney(item.price)} | 💵 Renta: $${formatMoney(item.rent)}/h\n`;
        text += `   📝 ${item.description}\n`;
        text += `   🏷️ \`${item.id}\`\n\n`;
      }

      text += `📝 Usa *.buyprop ID* para comprar`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    // Ver propiedades del usuario
    const myProps = getProperties(sender);
    const rentPerHour = getTotalRentPerHour(sender);

    if (args[0] === 'mias' || args[0] === 'my') {
      if (myProps.length === 0) {
        await sock.sendMessage(from, { text: '🏠 No tienes propiedades.\nUsa *.props* para ver las disponibles.' }, { quoted: m });
        return;
      }

      let text = `🏠 *Tus Propiedades (${myProps.length})*\n\n`;
      for (const prop of myProps) {
        text += `${prop.emoji} *${prop.name}*\n`;
        text += `   💵 Renta: $${formatMoney(prop.rent)}/h\n`;
        text += `   💰 Venta: $${formatMoney(prop.sellPrice)}\n\n`;
      }

      text += `💵 Renta total: *$${formatMoney(rentPerHour)}/hora*`;
      text += `\n📝 Usa *.collect* para cobrar renta`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    // Mostrar categorías + resumen
    let text = `╭━━━━━━━━━━━━━━━━━━━━╮\n`;
    text += `┃  🏠 *PROPIEDADES*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

    text += `📦 Tuyas: *${myProps.length}* propiedades\n`;
    text += `💵 Renta/hora: *$${formatMoney(rentPerHour)}*\n\n`;

    for (const cat of categories) {
      const items = getCatalog(cat);
      text += `${categoryNames[cat]} (${items.length})\n`;
      text += `│ \`.props ${cat}\`\n`;
    }

    text += `\n📝 \`.props mias\` - Ver tus propiedades`;
    text += `\n🛒 \`.buyprop ID\` - Comprar`;
    text += `\n💰 \`.collect\` - Cobrar renta`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
