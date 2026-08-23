'use strict';

import { giveMoney, formatMoney } from '../../lib/database.js';
import { header, bullet, money, footer, S } from '../../lib/style.js';

export default {
  command: ['give', 'enviar', 'pay', 'transferir'],
  category: 'economy',
  description: 'Envía dinero a otro usuario',
  run: async ({ sock, m, from, sender, args }) => {
    if (args.length < 2) {
      await sock.sendMessage(from, { text: `${S.info} Uso: *.give @usuario cantidad*` }, { quoted: m });
      return;
    }

    const targetRaw = args[0].replace(/[^0-9]/g, '');
    const targetId = targetRaw + '@s.whatsapp.net';
    const amount = parseInt(args[1]);

    if (targetId === sender) {
      await sock.sendMessage(from, { text: `${S.error} No puedes enviarte dinero a ti mismo.` }, { quoted: m });
      return;
    }

    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: `${S.error} Cantidad inválida.` }, { quoted: m });
      return;
    }

    const success = giveMoney(sender, targetId, amount);
    if (!success) {
      await sock.sendMessage(from, { text: `${S.error} No tienes suficiente dinero.` }, { quoted: m });
      return;
    }

    let text = `${S.line}\n${S.heart} *¡TRANSFERENCIA!*\n${S.line}\n\n`;
    text += `${S.star} Enviaste *${money(amount)}* a @${targetRaw}\n`;
    text += `\n${S.lineStar}\n⚔️ ASTA BOT\n${S.lineStar}`;

    await sock.sendMessage(from, { text, mentions: [targetId] }, { quoted: m });
  },

  runAllw: async (ctx) => {
    return `${S.heart} *Give*: Solo disponible con argumentos`;
  },
};
