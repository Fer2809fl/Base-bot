'use strict';

import { getCatalog, isVip } from '../../lib/database.js';

export default {
  command: ['shop', 'tienda', 'store'],
  category: 'economy',
  description: 'Tienda del bot - compra items, boosts y VIP',
  run: async ({ sock, m, from, sender, args }) => {
    const category = args[0]?.toLowerCase() || null;
    const categories = ['boosts', 'vip', 'utils', 'cosmetics'];
    const categoryNames = { boosts: '✨ Boosts', vip: '👑 VIP', utils: '🔧 Utilidades', cosmetics: '🎨 Cosméticos' };
    const categoryEmojis = { boosts: '✨', vip: '👑', utils: '🔧', cosmetics: '🎨' };

    const hasVip = isVip(sender);

    if (category && categories.includes(category)) {
      const items = getCatalog(category);
      let text = `${categoryEmojis[category]} *Tienda - ${categoryNames[category]}*\n`;
      text += `VIP: ${hasVip ? '✅ Activo (20% descuento)' : '❌ No activo'}\n\n`;

      for (const item of items) {
        const price = hasVip ? Math.floor(item.price * 0.8) : item.price;
        text += `${item.emoji} *${item.name}*\n`;
        text += `   💰 $${price.toLocaleString('es-ES')}\n`;
        text += `   📝 ${item.description}\n`;
        text += `   🏷️ ID: \`${item.id}\`\n\n`;
      }

      text += `📝 Usa *.buy ID* para comprar`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    // Mostrar categorías
    let text = `╭━━━━━━━━━━━━━━━━━━━━╮\n`;
    text += `┃  🛍️ *TIENDA ASTA BOT*\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    text += `👑 VIP: ${hasVip ? '✅ Activo (20% desc)' : '❌ No activo'}\n\n`;

    for (const cat of categories) {
      const items = getCatalog(cat);
      text += `${categoryEmojis[cat]} *${categoryNames[cat]}* (${items.length} items)\n`;
      text += `│ \`.shop ${cat}\` - Ver items\n`;
    }

    text += `\n📝 Usa \`.shop nombre\` para ver una categoría`;
    text += `\n🛒 Usa \`.buy ID\` para comprar`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
