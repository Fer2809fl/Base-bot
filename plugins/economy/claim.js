'use strict';

import { claimEvent, getActiveEvent, trySpawnEvent, addMoney, addXp, formatMoney } from '../../lib/database.js';
import { header, bullet, money, footer, S } from '../../lib/style.js';

export default {
  command: ['claim', 'reclamar'],
  category: 'economy',
  description: 'Reclama la recompensa del evento activo',
  run: async ({ sock, m, from, sender }) => {
    trySpawnEvent();

    const result = claimEvent(sender);

    if (!result.success) {
      await sock.sendMessage(from, { text: `${S.error} ${result.error}` }, { quoted: m });
      return;
    }

    const { event, reward, xp } = result;
    addMoney(sender, reward);
    const lvl = addXp(sender, xp);

    let text = `${S.line}\n${event.emoji} *¡EVENTO RECLAMADO!*\n${S.line}\n\n`;
    text += `${S.star} *${event.name}*\n`;
    text += `${S.money} Recibiste: *${money(reward)}*\n`;
    text += `${S.star2} +${xp} XP`;
    if (event.effect) {
      text += `\n${S.fire} Efecto: x${event.effectValue} activado`;
    }
    if (lvl.leveledUp) {
      text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
    }

    text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
