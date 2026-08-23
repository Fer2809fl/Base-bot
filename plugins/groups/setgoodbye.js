'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['setgoodbye', 'setadios', 'setdespedida'],
  category: 'grupo',
  description: 'Cambia el mensaje de despedida',
  group: true,
  admin: true,
  run: async ({ sock, m, from, text }) => {
    if (!text) {
      return sock.sendMessage(from, {
        text: `📝 Uso: .setgoodbye Adiós @user, te extrañaremos!\n\n📋 *Variables:*\n> @user → Menciona al usuario\n> @group → Nombre del grupo`,
      }, { quoted: m });
    }

    const config = getGroupConfig(from);
    config.goodbyeMsg = text;
    await sock.sendMessage(from, { text: '✅ Mensaje de despedida actualizado.' }, { quoted: m });
  },
};
