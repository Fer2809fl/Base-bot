'use strict';

import { getActiveEvent, claimEvent, trySpawnEvent, getTimeUntilNextEvent, addMoney, addXp, formatMoney, formatCooldown } from '../../lib/database.js';
import { header, section, bullet, bulletSimple, money, time, footer, S } from '../../lib/style.js';

export default {
  command: ['events', 'eventos', 'evento', 'event'],
  category: 'economy',
  description: 'Reclama recompensas de eventos aleatorios',
  run: async ({ sock, m, from, sender }) => {
    // Intentar spawnear evento
    trySpawnEvent();

    const event = getActiveEvent();

    if (!event) {
      const next = getTimeUntilNextEvent();
      let text = `${S.line}\n${S.star} *EVENTOS*\n${S.line}\n\n`;
      text += `${S.clock} Próximo evento en: *${time(next)}*\n`;
      text += `${S.lineThin}\n`;
      text += `Los eventos aparecen cada ~15 minutos.\n`;
      text += `Usa *.events* cuando veas un evento.`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    const remaining = event.expiresAt - Date.now();
    let text = `${S.line}\n${event.emoji} *${event.name}*\n${S.line}\n\n`;
    text += `${event.description}\n\n`;
    text += `${S.clock} Tiempo: *${time(remaining)}*\n`;

    if (event.reward) {
      text += `${S.money} Premio: *${money(event.reward.min)} - ${money(event.reward.max)}*\n`;
    }
    if (event.xp) {
      text += `${S.star2} XP: *${event.xp}*\n`;
    }
    if (event.effect) {
      text += `${S.fire} Efecto: *x${event.effectValue} ${event.effect}*\n`;
    }

    text += `\n${S.lineThin}\n`;
    text += `📝 Usa *.claim* para reclamar`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
