'use strict';

import { getGroupConfig } from '../../lib/database.js';

const userMessages = new Map();
const WINDOW = 5000;
const MAX_MSGS = 5;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [k, v] of userMessages) {
    if (now - v.t > WINDOW * 2) userMessages.delete(k);
  }
}

export async function antifloodCheck(sock, msg, from) {
  cleanup();
  const sender = msg.key.participant || msg.key.remoteJid;
  const now = Date.now();

  if (!userMessages.has(sender)) {
    userMessages.set(sender, { c: 1, t: now });
    return false;
  }

  const data = userMessages.get(sender);
  if (now - data.t > WINDOW) { data.c = 1; data.t = now; return false; }

  data.c++;
  if (data.c > MAX_MSGS) {
    try {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.sendMessage(from, { text: `🚫 @${sender.split('@')[0]}, flood.`, mentions: [sender] });
    } catch {}
    return true;
  }
  return false;
}

export default {
  command: ['antiflood'],
  category: 'grupo',
  description: 'Activa/desactiva el anti-flood',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const a = args[0]?.toLowerCase();
    if (a === 'on') config.antiflood = true;
    else if (a === 'off') config.antiflood = false;
    else config.antiflood = !config.antiflood;
    await sock.sendMessage(from, { text: `🚫 Anti-flood ${config.antiflood ? '✅ ON' : '❌ OFF'}` }, { quoted: m });
  },
};
