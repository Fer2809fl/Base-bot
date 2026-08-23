'use strict';

import { getPets, getPetCatalog, adoptPet, formatMoney } from '../../lib/database.js';

export default {
  command: ['pet', 'pets', 'mascotas', 'mascota'],
  category: 'economy',
  description: 'Ve tus mascotas o el catálogo',
  run: async ({ sock, m, from, sender, args }) => {
    // Ver catálogo
    if (args[0] === 'shop' || args[0] === 'tienda' || args[0] === 'catalog') {
      const catalog = getPetCatalog();
      let text = `🏪 *Tienda de Mascotas*\n\n`;
      for (const pet of catalog) {
        text += `${pet.emoji} *${pet.name}* - $${formatMoney(pet.price)}\n`;
        text += `   📝 ${pet.description}\n`;
        text += `   ⚔️ ATK:${pet.stats.attack} 🛡️ DEF:${pet.stats.defense} 💨 SPD:${pet.stats.speed}\n`;
        text += `   💵 Ingreso: $${pet.baseIncome}/30min\n`;
        text += `   🏷️ \`${pet.id}\`\n\n`;
      }
      text += `📝 Usa *.adopt ID* para adoptar`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    // Ver mascotas propias
    const pets = getPets(sender);
    if (pets.length === 0) {
      await sock.sendMessage(from, { text: `🐾 No tienes mascotas.\n\nUsa *.pet shop* para ver el catálogo\nUsa *.adopt ID* para adoptar una.` }, { quoted: m });
      return;
    }

    let text = `🐾 *Tus Mascotas (${pets.length}/5)*\n\n`;
    pets.forEach((pet, i) => {
      const happinessBar = generateBar(pet.happiness, 100, 8);
      const energyBar = generateBar(pet.energy, 100, 8);
      text += `${pet.emoji} *${pet.name}* (Nv.${pet.level})\n`;
      text += `   ❤️ ${happinessBar} | ⚡ ${energyBar}\n`;
      text += `   ⚔️ ATK:${pet.attack} 🛡️ DEF:${pet.defense} 💨 SPD:${pet.speed}\n`;
      text += `   💵 Ingreso: $${pet.baseIncome}/30min\n\n`;
    });

    text += `📝 \`.adopt ID\` | \`.feed index comida\` | \`.petfight index @user index\``;
    await sock.sendMessage(from, { text }, { quoted: m });
  },
};

function generateBar(current, max, length) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
