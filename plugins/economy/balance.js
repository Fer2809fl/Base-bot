'use strict';

import { getUser, formatMoney, addXp, isVip, getVipInfo, getTitle } from '../../lib/database.js';
import { header, bullet, bulletSimple, barPercent, money, footer, S } from '../../lib/style.js';

const XP_REWARD = 5;

export default {
  command: ['bal', 'balance', 'saldo', 'dinero', 'money'],
  category: 'economy',
  description: 'Consulta tu saldo o el de otro usuario',
  run: async ({ sock, m, from, sender, args }) => {
    const targetId = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
    const user = getUser(targetId);
    const isSelf = targetId === sender;
    const mention = isSelf ? 'Tu' : `De @${targetId.split('@')[0]}`;
    const title = getTitle(targetId);
    const vipInfo = getVipInfo(targetId);

    let text = `${S.line}\n${S.money} *SALDO ${mention.toUpperCase()}*\n${S.line}\n\n`;
    text += `${S.diamond} Nivel: *${user.level || 1}*\n`;
    text += `${S.star3} XP: *${barPercent(user.xp || 0, (user.level || 1) * 100, 8)}*\n`;
    text += `${S.lineThin}\n`;
    text += `${S.star} Wallet: *${money(user.balance)}*\n`;
    text += `${S.diamond} Banco: *${money(user.bank)}*\n`;
    text += `${S.trophy} Total: *${money(user.balance + user.bank)}*\n`;
    if (title) text += `${S.crown} Título: *${title}*\n`;
    if (vipInfo) text += `${S.gem} VIP: *${vipInfo.name}*\n`;
    text += `\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const user = getUser(ctx.sender);
    return `${S.money} *Bal*: 💰${money(user.balance)} | 🏦${money(user.bank)} | ⭐Nv.${user.level || 1}`;
  },
};
