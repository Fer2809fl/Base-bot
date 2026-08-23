'use strict';

import { getGroupConfig, setGroupConfig, toggleGroupSetting } from '../../lib/database.js';

export default {
  command: ['welcome', 'bienvenida'],
  category: 'grupo',
  description: 'Configura welcome/goodbye del grupo',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
      config.welcome = true;
      config.goodbye = true;
      return sock.sendMessage(from, { text: '👋 Welcome y Goodbye ACTIVADOS.' }, { quoted: m });
    }

    if (action === 'off') {
      config.welcome = false;
      config.goodbye = false;
      return sock.sendMessage(from, { text: '👋 Welcome y Goodbye DESACTIVADOS.' }, { quoted: m });
    }

    if (action === 'set') {
      const msg = args.slice(1).join(' ');
      if (!msg) return sock.sendMessage(from, { text: '📝 Uso: .welcome set Hola @user bienvenido a @group!' }, { quoted: m });
      config.welcomeMsg = msg;
      return sock.sendMessage(from, { text: '✅ Mensaje de welcome actualizado.' }, { quoted: m });
    }

    if (action === 'bye') {
      const msg = args.slice(1).join(' ');
      if (!msg) return sock.sendMessage(from, { text: '📝 Uso: .welcome bye ¡Adiós @user!' }, { quoted: m });
      config.goodbyeMsg = msg;
      return sock.sendMessage(from, { text: '✅ Mensaje de goodbye actualizado.' }, { quoted: m });
    }

    if (action === 'test') {
      const testMsg = config.welcomeMsg || '👋 ¡Bienvenido @user a @group!';
      const text = testMsg.replace(/@user/g, '@test').replace(/@group/g, '*Grupo Test*');
      return sock.sendMessage(from, { text: `🧪 *Preview welcome:*\n\n${text}`, mentions: [from] }, { quoted: m });
    }

    if (action === 'msg') {
      return sock.sendMessage(from, {
        text: `📋 *Configuración actual:*\n\n` +
          `> Welcome: ${config.welcome ? '✅' : '❌'}\n` +
          `> Goodbye: ${config.goodbye ? '✅' : '❌'}\n` +
          `> Msg welcome: ${config.welcomeMsg || '(predeterminado)'}\n` +
          `> Msg goodbye: ${config.goodbyeMsg || '(predeterminado)'}\n\n` +
          `📝 Variables: @user, @group`,
      }, { quoted: m });
    }

    config.welcome = !config.welcome;
    config.goodbye = config.welcome;
    await sock.sendMessage(from, { text: `👋 Welcome ${config.welcome ? '✅ ACTIVADO' : '❌ DESACTIVADO'}` }, { quoted: m });
  },
};
