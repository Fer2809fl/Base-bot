'use strict';

import { feedPet, getFoodCatalog, getPets, getUser, removeMoney, formatMoney } from '../../lib/database.js';

export default {
  command: ['feed', 'alimentar', 'comida'],
  category: 'economy',
  description: 'Alimenta a tu mascota',
  run: async ({ sock, m, from, sender, args }) => {
    // Ver catálogo de comida
    if (args[0] === 'shop' || args[0] === 'tienda') {
      const foods = getFoodCatalog();
      let text = `🍖 *Tienda de Comida*\n\n`;
      for (const f of foods) {
        text += `${f.emoji} *${f.name}* - $${formatMoney(f.price)}\n`;
        text += `   ❤️ +${f.happiness} felicidad | ⚡ +${f.energy} energía\n\n`;
      }
      text += `📝 Usa *.feed 0 ${foods[0].id}* para alimentar`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    if (args.length < 2) {
      await sock.sendMessage(from, { text: `❌ Uso: *.feed índice mascota comida*\nEjemplo: *.feed 0 gato pescado*\n\nUsa *.feed shop* para ver la comida\nLos índices empiezan en 0.` }, { quoted: m });
      return;
    }

    const petIndex = parseInt(args[0]);
    const foodId = args[1].toLowerCase();

    if (isNaN(petIndex) || petIndex < 0) {
      await sock.sendMessage(from, { text: '❌ Índice inválido. Empieza en 0.' }, { quoted: m });
      return;
    }

    const pets = getPets(sender);
    if (petIndex >= pets.length) {
      await sock.sendMessage(from, { text: `❌ Solo tienes ${pets.length} mascotas.` }, { quoted: m });
      return;
    }

    const food = getFoodCatalog().find((f) => f.id === foodId);
    if (!food) {
      await sock.sendMessage(from, { text: `❌ Comida "${foodId}" no encontrada.\nUsa *.feed shop* para ver las disponibles.` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    if (user.balance < food.price) {
      await sock.sendMessage(from, { text: `❌ Necesitas *$${formatMoney(food.price)}* pero solo tienes *$${formatMoney(user.balance)}*` }, { quoted: m });
      return;
    }

    removeMoney(sender, food.price);
    const result = feedPet(sender, petIndex, foodId);

    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    let text = `${food.emoji} *${result.pet.name} fue alimentado!*\n\n`;
    text += `❤️ Felicidad: ${result.pet.happiness}/100\n`;
    text += `⚡ Energía: ${result.pet.energy}/100\n`;
    text += `⭐ Nivel: ${result.pet.level} (XP: ${result.pet.xp}/${result.pet.level * 50})`;
    if (result.leveledUp) text += `\n\n🆙 ¡${result.pet.name} subió al nivel *${result.pet.level}*! +1 a todas las stats`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
