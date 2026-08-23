'use strict';

import { collectRent, addMoney, addXp, formatMoney, formatCooldown } from '../../lib/database.js';

export default {
  command: ['collect', 'cobrar', 'renta', 'rent'],
  category: 'economy',
  description: 'Cobra la renta de tus propiedades (1h cooldown)',
  cooldown: '1h',
  run: async ({ sock, m, from, sender }) => {
    const result = collectRent(sender);

    if (!result.success) {
      if (result.remaining) {
        await sock.sendMessage(from, { text: `⏰ Ya cobraste renta.\nVuelve en: *${formatCooldown(result.remaining)}*` }, { quoted: m });
        return;
      }
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    addMoney(sender, result.totalRent);
    const lvl = addXp(sender, 20);

    let text = `💰 *¡Renta cobrada!*\n\n`;
    text += `🏠 Propiedades: *${result.count}*\n`;
    text += `💵 Total cobrado: *$${formatMoney(result.totalRent)}*\n\n`;
    text += `⭐ +20 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const result = collectRent(ctx.sender);
    if (!result.success) return null;
    addMoney(ctx.sender, result.totalRent);
    const lvl = addXp(ctx.sender, 20);
    return `🏠 *Collect*: +$${formatMoney(result.totalRent)} (${result.count} props)${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
