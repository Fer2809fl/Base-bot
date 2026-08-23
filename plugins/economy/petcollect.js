'use strict';

import { collectIncome, getPets, addMoney, addXp, formatMoney, formatCooldown } from '../../lib/database.js';

export default {
  command: ['petcollect', 'petincome', 'mascotadinero'],
  category: 'economy',
  description: 'Cobra los ingresos de tus mascotas (30min)',
  cooldown: '30m',
  run: async ({ sock, m, from, sender }) => {
    const result = collectIncome(sender);

    if (!result.success) {
      if (result.remaining) {
        await sock.sendMessage(from, { text: `⏰ Ya cobraste ingresos.\nVuelve en: *${formatCooldown(result.remaining)}*` }, { quoted: m });
        return;
      }
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    addMoney(sender, result.totalIncome);
    const lvl = addXp(sender, 10);
    const pets = getPets(sender);

    let text = `🐾 *¡Ingresos de mascotas cobrados!*\n\n`;
    text += `🐾 Mascotas: *${result.count}*\n`;
    text += `💵 Total: *$${formatMoney(result.totalIncome)}*\n\n`;

    for (const pet of pets) {
      text += `${pet.emoji} ${pet.name}: $${Math.floor(pet.baseIncome * (1 + pet.level * 0.1) * (pet.happiness / 100))}\n`;
    }

    text += `\n⭐ +10 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const result = collectIncome(ctx.sender);
    if (!result.success) return null;
    addMoney(ctx.sender, result.totalIncome);
    const lvl = addXp(ctx.sender, 10);
    return `🐾 *PetCollect*: +$${formatMoney(result.totalIncome)} (${result.count} mascotas)${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
