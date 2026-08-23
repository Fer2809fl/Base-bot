'use strict';

import { formatInventory, formatCooldown } from '../../lib/database.js';

export default {
  command: ['inventory', 'inv', 'inventario', 'mochila'],
  category: 'economy',
  description: 'Ve tu inventario de items',
  run: async ({ sock, m, from, sender }) => {
    const inv = formatInventory(sender);

    let text = `🎒 *Tu Inventario*\n\n`;

    // Items
    if (inv.items.length === 0) {
      text += `📦 Items: *Vacío*\n`;
    } else {
      text += `📦 *Items:*\n`;
      for (const item of inv.items) {
        text += `  • ${item.id} (${item.effect})\n`;
      }
    }

    // Buffs activos
    text += `\n⚡ *Buffs Activos:*\n`;
    if (inv.activeBuffs.length === 0) {
      text += `  Ninguno activo\n`;
    } else {
      for (const buff of inv.activeBuffs) {
        const remaining = buff.expiresAt - Date.now();
        text += `  • ${buff.effect} x${buff.value} - ${formatCooldown(remaining)} restante\n`;
      }
    }

    // VIP
    text += `\n👑 *VIP:* `;
    if (inv.activeVip) {
      const remaining = inv.activeVip.expiresAt - Date.now();
      text += `✅ Activo - ${formatCooldown(remaining)} restante`;
    } else {
      text += `❌ No activo`;
    }

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
