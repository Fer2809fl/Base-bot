'use strict';

import { battlePets, getPets, addMoney, addXp, formatMoney } from '../../lib/database.js';

export default {
  command: ['petfight', 'pfight', 'mascotapelea', 'petbattle'],
  category: 'economy',
  description: 'Batalla tu mascota contra la de otro usuario',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 3) {
      await sock.sendMessage(from, { text: `❌ Uso: *.petfight índiceMascotaTuya @usuario índiceMascotaRival*\nEjemplo: *.petfight 0 @5214181234567 0*\n\nLos índices empiezan en 0.` }, { quoted: m });
      return;
    }

    const petIndex = parseInt(args[0]);
    const targetRaw = args[1].replace(/[^0-9]/g, '');
    const targetId = targetRaw + '@s.whatsapp.net';
    const targetPetIndex = parseInt(args[2]);

    if (isNaN(petIndex) || isNaN(targetPetIndex)) {
      await sock.sendMessage(from, { text: '❌ Los índices deben ser números.' }, { quoted: m });
      return;
    }

    if (targetId === sender) {
      await sock.sendMessage(from, { text: '❌ No puedes pelear contra ti mismo.' }, { quoted: m });
      return;
    }

    const myPets = getPets(sender);
    if (petIndex >= myPets.length) {
      await sock.sendMessage(from, { text: `❌ Solo tienes ${myPets.length} mascotas.` }, { quoted: m });
      return;
    }

    const targetPets = getPets(targetId);
    if (targetPetIndex >= targetPets.length) {
      await sock.sendMessage(from, { text: `❌ @${targetRaw} solo tiene ${targetPets.length} mascotas.`, mentions: [targetId] }, { quoted: m });
      return;
    }

    const result = battlePets(sender, petIndex, targetId, targetPetIndex);
    if (!result.success) {
      await sock.sendMessage(from, { text: `❌ ${result.error}` }, { quoted: m });
      return;
    }

    if (result.winner) {
      addMoney(sender, result.reward);
      const lvl = addXp(sender, 15);
      let text = `⚔️ *¡${result.attacker.name} ganó!*\n\n`;
      text += `${result.attacker.emoji} ${result.attacker.name} (Nv.${result.attacker.level}) vs ${result.defender.emoji} ${result.defender.name} (Nv.${result.defender.level})\n`;
      text += `💰 Recompensa: *$${formatMoney(result.reward)}*\n`;
      text += `❤️ Felicidad: ${result.attacker.happiness}/100`;
      text += `\n\n⭐ +15 XP`;
      if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;
      await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
    } else {
      const lvl = addXp(sender, 5);
      let text = `⚔️ *${result.attacker.name} perdió...*\n\n`;
      text += `${result.attacker.emoji} ${result.attacker.name} (Nv.${result.attacker.level}) vs ${result.defender.emoji} ${result.defender.name} (Nv.${result.defender.level})\n`;
      text += `❤️ Felicidad: ${result.attacker.happiness}/100`;
      text += `\n\n⭐ +5 XP (por intentar)`;
      if (lvl.leveledUp) text += `\n🆙 ¡Nivel *${lvl.newLevel}*!`;
      await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
    }
  },
};
