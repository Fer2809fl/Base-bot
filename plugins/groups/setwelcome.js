'use strict';

import { getGroupConfig } from '../../lib/database.js';

export default {
  command: ['setwelcome', 'setbienvenida'],
  category: 'grupo',
  description: 'Cambia el mensaje de bienvenida rápido',
  group: true,
  admin: true,
  run: async ({ sock, m, from, text }) => {
    if (!text) {
      return sock.sendMessage(from, {
        text: `📝 Uso: .setwelcome ¡Hola @user! Bienvenido a @group\n\n` +
          `📋 *Variables:*\n> @user → Menciona al usuario\n> @group → Nombre del grupo`,
      }, { quoted: m });
    }

    const config = getGroupConfig(from);
    config.welcomeMsg = text;
    await sock.sendMessage(from, { text: '✅ Mensaje de bienvenida actualizado.' }, { quoted: m });
  },
};
