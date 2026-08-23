'use strict';

import { getJackpot, getTimeUntilDraw, getUserTickets, getTotalTickets, buyTicket, getHistory, TICKET_PRICE, getUser, removeMoney, addXp, formatMoney, formatCooldown } from '../../lib/database.js';
import { header, bullet, bulletSimple, money, time, footer, S } from '../../lib/style.js';

export default {
  command: ['glottery', 'loteriag', 'globalottery', 'jackpot'],
  category: 'economy',
  description: 'Lotería global con jackpot creciente',
  run: async ({ sock, m, from, sender, args }) => {
    const jackpot = getJackpot();
    const timeLeft = getTimeUntilDraw();
    const userTickets = getUserTickets(sender);
    const totalTickets = getTotalTickets();

    if (args[0] === 'buy' || args[0] === 'comprar' || args[0] === 'ticket') {
      const numbers = args.slice(1).map(Number);
      if (numbers.length !== 4 || numbers.some(isNaN)) {
        await sock.sendMessage(from, { text: `${S.info} Uso: *.glottery buy 1 2 3 4*\nNúmeros del 0 al 9.` }, { quoted: m });
        return;
      }

      const user = getUser(sender);
      if (user.balance < TICKET_PRICE) {
        await sock.sendMessage(from, { text: `${S.error} Un ticket cuesta *${money(TICKET_PRICE)}*\nTienes: *${money(user.balance)}*` }, { quoted: m });
        return;
      }

      const result = buyTicket(sender, numbers);
      if (!result.success) {
        await sock.sendMessage(from, { text: `${S.error} ${result.error}` }, { quoted: m });
        return;
      }

      removeMoney(sender, TICKET_PRICE);
      const lvl = addXp(sender, 5);

      let text = `${S.line}\n${S.fire} *¡TICKET COMPRADO!*\n${S.line}\n\n`;
      text += `${S.target} Tus números: *${numbers.join(' ')}*\n`;
      text += `${S.box} Tickets: *${result.ticketCount}/3*\n`;
      text += `${S.money} Jackpot: *${money(result.jackpot)}*\n`;
      text += `${S.star2} +5 XP`;
      if (lvl.leveledUp) text += `\n\n${S.rocket} ¡NIVEL *${lvl.newLevel}*!`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    if (args[0] === 'history' || args[0] === 'historial') {
      const history = getHistory(5);
      if (history.length === 0) {
        await sock.sendMessage(from, { text: `${S.info} No hay historial aún.` }, { quoted: m });
        return;
      }

      let text = `${S.line}\n📜 *HISTORIAL DE LOTERÍA*\n${S.line}\n\n`;
      for (const draw of history) {
        text += `${S.target} Números: *${draw.winningNumbers.join(' ')}*\n`;
        text += `${S.money} Jackpot: *${money(draw.jackpot)}*\n`;
        if (draw.winners.length > 0) {
          for (const w of draw.winners) {
            text += `   ${S.trophy} #${w.position} @${w.userId.split('@')[0]} - ${w.matches}/4 - ${money(w.prize)}\n`;
          }
        } else {
          text += `   ${S.skull} Sin ganadores\n`;
        }
        text += `\n`;
      }

      text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      const mentions = history.flatMap((d) => d.winners.map((w) => w.userId));
      await sock.sendMessage(from, { text, mentions }, { quoted: m });
      return;
    }

    let text = `${S.line}\n${S.fire} *LOTERÍA GLOBAL*\n${S.line}\n\n`;
    text += `${S.money} JACKPOT: *${money(jackpot)}*\n\n`;
    text += `${S.box} Tickets vendidos: *${totalTickets}*\n`;
    text += `${S.box} Tus tickets: *${userTickets.length}/3*\n`;
    text += `${S.clock} Sorteo en: *${time(timeLeft)}*\n`;
    text += `${S.money} Costo: *${money(TICKET_PRICE)}*\n`;

    if (userTickets.length > 0) {
      text += `\n${S.section('TUS TICKETS')}\n`;
      for (const t of userTickets) {
        text += `${S.target} ${t.numbers.join(' ')}\n`;
      }
    }

    text += `\n${S.lineThin}\n`;
    text += `${S.arrow} *.glottery buy 1 2 3 4*\n`;
    text += `${S.arrow} *.glottery history*\n`;
    text += `${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },
};
