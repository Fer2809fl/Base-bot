'use strict';

import { getGroupConfig } from '../../lib/database.js';

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+/gi;

export async function antilinkCheck(sock, msg, from) {
  const config = getGroupConfig(from);
  if (!config.antilink) return;

  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  if (!URL_REGEX.test(body)) return;

  const sender = msg.key.participant || msg.key.remoteJid;
  const extractNum = (jid) => jid?.split('@')[0]?.split(':')[0] || '';
  const senderNum = extractNum(sender);

  const meta = await sock.groupMetadata(from);
  const p = meta.participants.find(pp => extractNum(pp.id) === senderNum);
  const isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin';

  if (isAdmin) return;

  try {
    await sock.sendMessage(from, { delete: msg.key });
    await sock.sendMessage(from, { text: `🚫 @${sender.split('@')[0]}, links no permitidos.`, mentions: [sender] });
  } catch {}
}
