'use strict';

import { getAllAchievements, getUserUnlocked, getProgress, getTotalRewards, checkAchievements, getUser } from '../../lib/database.js';

export default {
  command: ['achievements', 'logros', 'achieve', 'medals'],
  category: 'economy',
  description: 'Ve tus logros y progreso',
  run: async ({ sock, m, from, sender, args }) => {
    // Verificar nuevos logros
    const userData = getUser(sender);
    const newAch = checkAchievements(sender, userData);

    const unlocked = getUserUnlocked(sender);
    const progress = getProgress(sender);
    const totalRewards = getTotalRewards(sender);
    const allAch = getAllAchievements();

    if (args[0] === 'all' || args[0] === 'todos') {
      // Ver todos los logros
      let text = `🏆 *Todos los Logros (${progress.unlocked}/${progress.total})*\n`;
      text += `📊 Progreso: ${progress.percent}%\n`;
      text += `💰 Recompensas ganadas: *$${totalRewards.toLocaleString('es-ES')}*\n\n`;

      for (const ach of allAch) {
        const isUnlocked = unlocked.includes(ach.id);
        text += `${isUnlocked ? ach.emoji : '🔒'} *${ach.name}*\n`;
        text += `   ${isUnlocked ? '✅' : '❌'} ${ach.description}\n`;
        text += `   💰 Recompensa: $${ach.reward.toLocaleString('es-ES')}\n\n`;
      }

      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    // Ver logros propios
    let text = `🏆 *Tus Logros*\n\n`;
    text += `📊 Progreso: *${progress.unlocked}/${progress.total}* (${progress.percent}%)\n`;
    text += `💰 Recompensas: *$${totalRewards.toLocaleString('es-ES')}*\n\n`;

    // Barra de progreso
    const bar = generateBar(progress.unlocked, progress.total, 20);
    text += `${bar}\n\n`;

    // Logros desbloqueados
    if (unlocked.length === 0) {
      text += `❌ Aún no has desbloqueado ningún logro.\nUsa *.achievements all* para ver todos los disponibles.`;
    } else {
      text += `✅ *Desbloqueados (${unlocked.length}):*\n`;
      for (const achId of unlocked) {
        const ach = allAch.find((a) => a.id === achId);
        if (ach) {
          text += `  ${ach.emoji} ${ach.name} - ${ach.description}\n`;
        }
      }
    }

    // Mostrar nuevos desbloqueados
    if (newAch.length > 0) {
      text += `\n🎉 *¡NUEVOS LOGROS!*\n`;
      for (const ach of newAch) {
        text += `${ach.emoji} *${ach.name}* - ¡+$${ach.reward.toLocaleString('es-ES')}!\n`;
      }
    }

    text += `\n📝 *.achievements all* - Ver todos los logros`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};

function generateBar(current, max, length) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round((current / max) * 100)}%`;
}
