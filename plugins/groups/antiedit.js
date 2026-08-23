'use strict';

import { getGroupConfig } from '../../lib/database.js';

export async function antieditCheck(sock, msg) {
  const editedKey = msg.message?.protocolMessage?.key;
  if (!editedKey) return;

  const from = msg.key.remoteJid;
  const config = getGroupConfig(from);
  if (!config.antiedit) return;

  const editedMsg = msg.message?.protocolMessage?.editedMessage;
  if (!editedMsg) return;

  const sender = editedKey.participant || editedKey.remoteJid;
  const newText = editedMsg.conversation || editedMsg.extendedTextMessage?.text || '(no texto)';

  await sock.sendMessage(from, {
    text: `✏️ *Editado @${sender.split('@')[0]}:*\n> ${newText}`,
    mentions: [sender],
  }).catch(() => {});
}

export default {
  command: ['antiedit'],
  category: 'grupo',
  description: 'Activa/desactiva el anti-edit',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const action = args[0]?.toLowerCase();
    if (action === 'on') { config.antiedit = true; }
    else if (action === 'off') { config.antiedit = false; }
    else { config.antiedit = !config.antiedit; }
    await sock.sendMessage(from, { text: `✏️ Anti-edit ${config.antiedit ? '✅ ON' : '❌ OFF'}` }, { quoted: m });
  },
};
