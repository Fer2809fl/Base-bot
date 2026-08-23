'use strict';

const afkUsers = new Map();
const MAX_AFK = 24 * 60 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300000) return;
  lastCleanup = now;
  for (const [k, v] of afkUsers) {
    if (now - v.t > MAX_AFK) afkUsers.delete(k);
  }
}

export default {
  command: ['afk'],
  category: 'grupo',
  description: 'Marca tu estado como AFK',
  group: true,
  run: async ({ sock, m, from, sender, text }) => {
    afkUsers.set(sender, { r: text || 'Sin razón', t: Date.now() });
    await sock.sendMessage(from, {
      text: `🌙 @${sender.split('@')[0]} AFK.`,
      mentions: [sender],
    }, { quoted: m });
  },
};

export async function afkMentionHandler(sock, msg, from) {
  cleanup();
  const sender = msg.key.participant || msg.key.remoteJid;

  if (afkUsers.has(sender)) {
    const d = afkUsers.get(sender);
    const mins = Math.floor((Date.now() - d.t) / 60000);
    afkUsers.delete(sender);
    await sock.sendMessage(from, { text: `☀️ @${sender.split('@')[0]} volvió. (${mins}min AFK)`, mentions: [sender] });
  }

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  for (const jid of mentioned) {
    if (afkUsers.has(jid)) {
      const d = afkUsers.get(jid);
      const mins = Math.floor((Date.now() - d.t) / 60000);
      await sock.sendMessage(from, { text: `🌙 @${jid.split('@')[0]} AFK (${mins}min)`, mentions: [jid] });
    }
  }
}
