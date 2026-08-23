'use strict';

import { getGroupConfig } from '../../lib/database.js';

export async function welcomeHandler(sock, update) {
  const { id, participants, action } = update;
  if (!id.endsWith('@g.us')) return;

  const config = getGroupConfig(id);
  if ((action === 'add' && !config.welcome) || (action === 'remove' && !config.goodbye)) return;

  try {
    const meta = await sock.groupMetadata(id);
    const groupName = meta.subject;

    for (const participant of participants) {
      const num = participant.split('@')[0];
      const mentions = [participant];

      if (action === 'add') {
        const msg = config.welcomeMsg || `👋 ¡Bienvenido @${num} a *${groupName}*!\n\nUsa *.menu* para ver los comandos.`;
        const text = msg.replace(/@user/g, `@${num}`).replace(/@group/g, `*${groupName}*`);
        await sock.sendMessage(id, { text, mentions });
      }

      if (action === 'remove') {
        const msg = config.goodbyeMsg || `👋 Adiós @${num}. ¡Te extrañaremos!`;
        const text = msg.replace(/@user/g, `@${num}`).replace(/@group/g, `*${groupName}*`);
        await sock.sendMessage(id, { text, mentions });
      }
    }
  } catch {}
}
