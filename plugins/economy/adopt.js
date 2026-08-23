'use strict';

import { adoptPet, getUser, removeMoney, addXp, formatMoney } from '../../lib/database.js';

export default {
  command: ['adopt', 'adoptar'],
  category: 'economy',
  description: 'Adopta una mascota del catálogo',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `❌ Uso: *.adopt ID*\nEjemplo: *.adopt gato*\n\nUsa *.pet shop* para ver las disponibles.` }, { quoted: m });
      return;
    }

    const petId = args[0].toLowerCase();
    const customName = args[1] || null;

    // Verificar precio
    const { getPetCatalog } = await import('../../lib/pets.js');
    const template = getPetCatalog().find((p) => p.id === petId);
    if (!template) {
      await sock.sendMessage(from, { text: `❌ Mascota "${petId}" no encontrada.\nUsa *.pet shop* para ver las disponibles.` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < template.price) {
      await sock.sendMessage(from, { text: `❌ Necesitas *$${formatMoney(template.price)}* pero solo tienes *$${formatMoney(user.balance)}*` }, { quoted: m });
      return;
    }

    const result = adoptPet(sender, petId, customName);
    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    removeMoney(sender, template.price);
    const lvl = addXp(sender, 25);
    const u = getUser(sender);
    u.petsOwned = (u.petsOwned || 0) + 1;

    let text = `🐾 *¡Mascota adoptada!*\n\n`;
    text += `${result.pet.emoji} *${result.pet.name}*\n`;
    text += `💰 Costo: *$${formatMoney(template.price)}*\n`;
    text += `📝 ${template.description}\n`;
    text += `💵 Ingreso: *$${template.baseIncome}*/30min`;
    text += `\n\n⭐ +25 XP`;
    if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
