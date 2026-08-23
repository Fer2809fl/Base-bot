'use strict';

import { addMoney, addXp, formatMoney, getUser } from '../../lib/database.js';

export default {
  command: ['raid', 'raids', 'ataque'],
  category: 'grupo',
  description: 'Inicia una raid grupal contra un jefe',
  group: true,
  argsRequired: true,
  usage: 'Uso: .raid [nivel] (1-10)',
  run: async ({ sock, m, from, sender, args }) => {
    const level = parseInt(args[0]) || 1;
    if (level < 1 || level > 10) {
      return sock.sendMessage(from, { text: '📝 Uso: .raid [nivel 1-10]' }, { quoted: m });
    }

    const meta = await sock.groupMetadata(from);
    const participants = meta.participants.filter(p => !p.admin || p.admin === 'none');

    if (participants.length < 3) {
      return sock.sendMessage(from, { text: '⚠️ Se necesitan al menos 3 miembros no-admin para una raid.' }, { quoted: m });
    }

    // Boss stats
    const bossHp = level * 500;
    const bossAtk = level * 50;
    const bossNames = ['Goblin', 'Orc', 'Dragon', 'Demon Lord', 'Dark Knight', 'Lich', 'Hydra', 'Titan', 'Void Beast', 'World Ender'];
    const bossEmoji = ['👹', '👺', '🐉', '👿', '⚔️', '💀', '🐍', '🗿', '🌀', '🌋'];
    const bossName = bossNames[level - 1];
    const bossEm = bossEmoji[level - 1];

    // Simular combate
    let partyDmg = 0;
    for (const p of participants) {
      const user = getUser(p.id);
      const userAtk = (user.level || 1) * 5 + Math.floor(Math.random() * 30);
      partyDmg += userAtk;
    }

    const success = partyDmg > bossHp;

    let text = `⚔️ *¡RAID INICIADA!*\n\n`;
    text += `${bossEm} *${bossName}* (Nivel ${level})\n`;
    text += `❤️ HP: ${bossHp}\n\n`;
    text += `👥 *Equipo:* ${participants.length} guerreros\n`;
    text += `⚔️ *Daño del equipo:* ${partyDmg}\n\n`;

    if (success) {
      const reward = level * 200;
      const xpReward = level * 30;
      text += `✅ *¡VICTORIA!* ${bossName} derrotado!\n`;
      text += `💰 Recompensa: $${formatMoney(reward)} por persona\n`;
      text += `⭐ XP: +${xpReward} por persona\n`;

      for (const p of participants) {
        addMoney(p.id, reward);
        addXp(p.id, xpReward);
      }
    } else {
      text += `❌ *DERROTA.* ${bossName} era demasiado fuerte.\n`;
      text += `💔 El equipo necesitaba más poder.`;
    }

    await sock.sendMessage(from, { text, mentions: participants.slice(0, 10) }, { quoted: m });
  },
};
