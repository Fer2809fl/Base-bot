'use strict';

import { formatMoney, formatCooldown, getCooldownRemaining, checkCooldown, addXp, getUser } from '../../lib/database.js';
import { header, bullet, bulletSimple, money, time, footer, S } from '../../lib/style.js';
import { getPlugins } from '../../lib/handler.js';

const ALLW_COOLDOWN = 1 * 60 * 1000;
const ALLW_XP = 50;

export default {
  command: ['allw', 'allwork', 'todo'],
  category: 'economy',
  description: 'Ejecuta todos los comandos de economía (1min cooldown)',
  cooldown: '1m',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'allwLast', ALLW_COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} *AllW* cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'allwLast', ALLW_COOLDOWN);

    const allPlugins = getPlugins();
    const economyPlugins = allPlugins.filter((p) => p.category === 'economy' && p.runAllw && !p.command.includes('allw'));

    if (economyPlugins.length === 0) {
      await sock.sendMessage(from, { text: `${S.error} No hay comandos disponibles.` }, { quoted: m });
      return;
    }

    await sock.sendMessage(from, { text: `${S.lightning} *Ejecutando ALLW...*\nProcesando *${economyPlugins.length}* comandos...` }, { quoted: m });

    const ctx = { sock, m, from, sender };
    const results = [];

    for (const plugin of economyPlugins) {
      try {
        const result = await plugin.runAllw(ctx);
        if (result) {
          results.push(result);
        } else {
          const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
          results.push(`${S.clock} ${cmdName}: *En cooldown*`);
        }
      } catch (err) {
        const cmdName = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
        results.push(`${S.error} ${cmdName}: Error`);
      }
    }

    const lvl = addXp(sender, ALLW_XP);
    const user = getUser(sender);

    let text = `${S.line}\n${S.lightning} *ALLW COMPLETADO*\n${S.line}\n\n`;

    for (const r of results) {
      text += `${r}\n`;
    }

    text += `\n${S.lineThin}\n`;
    text += `${S.star2} +${ALLW_XP} XP bonus\n`;
    if (lvl.leveledUp) text += `${S.rocket} ¡NIVEL *${lvl.newLevel}*!\n`;
    text += `${S.money} Total: *${money(user.balance + user.bank)}*\n`;
    text += `${S.clock} Próximo ALLW en: *1 minuto*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
