'use strict';

import { getUser, removeMoney, addMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 20 * 60 * 1000;
const SUCCESS = 0.4;
const XP = 20;

export default {
  command: ['rob', 'robar', 'asaltar'],
  category: 'economy',
  description: 'Intenta robar a otro (20min)',
  cooldown: '20m',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 1) {
      await sock.sendMessage(from, { text: `${S.info} Uso: *.rob @usuario*` }, { quoted: m });
      return;
    }

    const targetRaw = args[0].replace(/[^0-9]/g, '');
    const targetId = targetRaw + '@s.whatsapp.net';

    if (targetId === sender) {
      await sock.sendMessage(from, { text: `${S.error} No puedes robarte a ti mismo.` }, { quoted: m });
      return;
    }

    const remaining = getCooldownRemaining(sender, 'robLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const victim = getUser(targetId);
    if (victim.balance <= 0) {
      await sock.sendMessage(from, { text: `${S.error} Esa persona no tiene dinero.` }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'robLast', COOLDOWN);
    const success = Math.random() < SUCCESS;
    const robber = getUser(sender);

    if (success) {
      const percent = 0.1 + Math.random() * 0.2;
      const stolen = Math.floor(victim.balance * percent);
      removeMoney(targetId, stolen);
      addMoney(sender, stolen);
      addXp(sender, XP);
      let text = `${S.line}\n🚨 *¡ROBO EXITOSO!*\n${S.line}\n\n`;
      text += `${S.star} Robaste *${money(stolen)}* a @${targetRaw}\n`;
      text += `${S.star2} +${XP} XP`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
    } else {
      const fine = Math.floor(robber.balance * 0.15);
      removeMoney(sender, fine);
      let text = `${S.line}\n🚨 *¡TE ATRAPARON!*\n${S.line}\n\n`;
      text += `${S.minus} Perdiste: *-${money(fine)}*\n`;
      text += `${S.star2} +${Math.floor(XP / 2)} XP`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
    }
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'robLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'robLast', COOLDOWN);
    return `${S.skull} *Rob*: Necesita objetivo`;
  },
};
