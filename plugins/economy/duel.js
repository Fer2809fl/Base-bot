'use strict';

import { addMoney, removeMoney, addXp, checkCooldown, formatMoney, formatCooldown, getCooldownRemaining, getUser } from '../../lib/database.js';
import { header, bullet, money, time, footer, S } from '../../lib/style.js';

const COOLDOWN = 15 * 60 * 1000;
const XP = 25;

export default {
  command: ['duel', 'duelo', 'pelear', 'fight'],
  category: 'economy',
  description: 'Duela a otro usuario (15min)',
  cooldown: '15m',
  run: async ({ sock, m, from, sender, args }) => {
    const remaining = getCooldownRemaining(sender, 'duelLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    if (args.length < 2) {
      await sock.sendMessage(from, { text: `${S.info} Uso: *.duel @usuario cantidad*` }, { quoted: m });
      return;
    }

    const targetRaw = args[0].replace(/[^0-9]/g, '');
    const targetId = targetRaw + '@s.whatsapp.net';
    const amount = parseInt(args[1]);

    if (targetId === sender) {
      await sock.sendMessage(from, { text: `${S.error} No puedes duelarte contigo mismo.` }, { quoted: m });
      return;
    }

    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: `${S.error} Cantidad inválida.` }, { quoted: m });
      return;
    }

    const user = getUser(sender);
    const target = getUser(targetId);

    if (user.balance < amount) {
      await sock.sendMessage(from, { text: `${S.error} No tienes suficiente dinero.` }, { quoted: m });
      return;
    }

    if (target.balance < amount) {
      await sock.sendMessage(from, { text: `${S.error} @${targetRaw} no tiene suficiente.`, mentions: [targetId] }, { quoted: m });
      return;
    }

    checkCooldown(sender, 'duelLast', COOLDOWN);

    const atkPower = Math.random() * (user.level || 1) + Math.random() * 50;
    const defPower = Math.random() * (target.level || 1) + Math.random() * 50;

    if (atkPower > defPower) {
      addMoney(sender, amount);
      removeMoney(targetId, amount);
      const u = getUser(sender);
      u.duelsWon = (u.duelsWon || 0) + 1;
      const lvl = addXp(sender, XP);
      let text = `${S.line}\n⚔️ *¡DUELO GANADO!*\n${S.line}\n\n`;
      text += `${S.star} Le ganaste a @${targetRaw}\n`;
      text += `${S.money} Ganaste: *${money(amount)}*\n`;
      text += `${S.star2} +${XP} XP`;
      if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
    } else {
      removeMoney(sender, amount);
      addMoney(targetId, amount);
      const u = getUser(sender);
      u.duelsLost = (u.duelsLost || 0) + 1;
      const lvl = addXp(sender, XP);
      let text = `${S.line}\n⚔️ *¡DUELO PERDIDO!*\n${S.line}\n\n`;
      text += `${S.star} @${targetRaw} te ganó\n`;
      text += `${S.minus} Perdiste: *-${money(amount)}*\n`;
      text += `${S.star2} +${XP} XP (por intentar)`;
      if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
    }
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'duelLast', COOLDOWN);
    if (remaining > 0) return null;
    checkCooldown(ctx.sender, 'duelLast', COOLDOWN);
    const user = getUser(ctx.sender);
    const won = Math.random() < 0.5;
    const amount = Math.min(50, user.balance);
    if (won && amount > 0) addMoney(ctx.sender, amount);
    const lvl = addXp(ctx.sender, XP);
    return `${S.sword} *Duel*: ${won ? 'Victoria' : 'Derrota'}${amount > 0 ? (won ? ' +$' : '-$') + money(amount) : ''}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
