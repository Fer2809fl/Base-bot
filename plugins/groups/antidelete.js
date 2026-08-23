'use strict';

import { getGroupConfig } from '../../lib/database.js';

const msgStore = new Map();
const MAX_STORE = 2000;
const STORE_TTL = 3600000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300000) return;
  lastCleanup = now;
  for (const [k, v] of msgStore) {
    if (now - v.t > STORE_TTL) msgStore.delete(k);
  }
  if (msgStore.size > MAX_STORE) {
    const entries = [...msgStore.entries()].sort((a, b) => a[1].t - b[1].t);
    for (let i = 0; i < entries.length - MAX_STORE; i++) msgStore.delete(entries[i][0]);
  }
}

export function storeMessage(msg) {
  cleanup();
  const key = msg.key?.id;
  if (!key) return;
  msgStore.set(key, { m: msg.message, s: msg.key.participant || msg.key.remoteJid, t: Date.now() });
}

export async function antideleteCheck(sock, msg) {
  const deletedId = msg.message?.protocolMessage?.key?.id;
  if (!deletedId) return;
  const from = msg.key.remoteJid;
  const config = getGroupConfig(from);
  if (!config.antidelete) return;
  const original = msgStore.get(deletedId);
  if (!original) return;
  const text = JSON.stringify(original.m, null, 2).slice(0, 2000);
  await sock.sendMessage(from, {
    text: `🔄 *Eliminado @${original.s.split('@')[0]}:*\n\n${text}`,
    mentions: [original.s],
  }).catch(() => {});
}

export default {
  command: ['antidelete'],
  category: 'grupo',
  description: 'Activa/desactiva el anti-delete',
  group: true,
  admin: true,
  run: async ({ sock, m, from, args }) => {
    const config = getGroupConfig(from);
    const a = args[0]?.toLowerCase();
    if (a === 'on') config.antidelete = true;
    else if (a === 'off') config.antidelete = false;
    else config.antidelete = !config.antidelete;
    await sock.sendMessage(from, { text: `🔄 Anti-delete ${config.antidelete ? '✅ ON' : '❌ OFF'}` }, { quoted: m });
  },
};
