'use strict';

import { deposit, withdraw, getUser, formatMoney } from '../../lib/database.js';
import { header, bullet, money, footer, S } from '../../lib/style.js';

export default {
  command: ['bank', 'banco', 'dep', 'depositar', 'wd', 'withdraw', 'retirar'],
  category: 'economy',
  description: 'Deposita o retira dinero del banco',
  run: async ({ sock, m, from, sender, command, args }) => {
    const user = getUser(sender);

    if (args.length === 0) {
      let text = `${S.line}\n${S.diamond} *TU BANCO*\n${S.line}\n\n`;
      text += `${S.star} Wallet: *${money(user.balance)}*\n`;
      text += `${S.diamond} Banco: *${money(user.bank)}*\n\n`;
      text += `${S.lineThin}\n`;
      text += `${S.arrow} *.dep cantidad* - Depositar\n`;
      text += `${S.arrow} *.wd cantidad* - Retirar\n`;
      text += `${S.arrow} *.dep all* - Depositar todo\n`;
      text += `${S.arrow} *.wd all* - Retirar todo`;
      text += `\n\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;
      await sock.sendMessage(from, { text }, { quoted: m });
      return;
    }

    const isDeposit = ['dep', 'depositar', 'bank', 'banco'].includes(command);
    const amountStr = args[0];
    const isAll = amountStr.toLowerCase() === 'all';

    if (isDeposit) {
      const amount = isAll ? user.balance : parseInt(amountStr);
      if (!amount || amount <= 0) { await sock.sendMessage(from, { text: `${S.error} Cantidad inválida.` }, { quoted: m }); return; }
      if (!deposit(sender, amount)) { await sock.sendMessage(from, { text: `${S.error} No tienes suficiente.` }, { quoted: m }); return; }
      const u = getUser(sender);
      let text = `${S.success} Depositaste *${money(amount)}*\n\n`;
      text += `${S.star} Wallet: *${money(u.balance)}*\n${S.diamond} Banco: *${money(u.bank)}*`;
      await sock.sendMessage(from, { text }, { quoted: m });
    } else {
      const amount = isAll ? user.bank : parseInt(amountStr);
      if (!amount || amount <= 0) { await sock.sendMessage(from, { text: `${S.error} Cantidad inválida.` }, { quoted: m }); return; }
      if (!withdraw(sender, amount)) { await sock.sendMessage(from, { text: `${S.error} No tienes suficiente en el banco.` }, { quoted: m }); return; }
      const u = getUser(sender);
      let text = `${S.success} Retiraste *${money(amount)}*\n\n`;
      text += `${S.star} Wallet: *${money(u.balance)}*\n${S.diamond} Banco: *${money(u.bank)}*`;
      await sock.sendMessage(from, { text }, { quoted: m });
    }
  },

  runAllw: async (ctx) => {
    const u = getUser(ctx.sender);
    return `${S.diamond} *Bank*: 💰${money(u.balance)} | 🏦${money(u.bank)}`;
  },
};
