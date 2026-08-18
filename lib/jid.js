'use strict';

export function normalizeJid(jid = '') {
  if (!jid) return jid;
  if (
    jid.endsWith('@g.us') ||
    jid.endsWith('@s.whatsapp.net') ||
    jid.endsWith('@broadcast') ||
    jid.endsWith('@lid')
  ) {
    return jid;
  }
  return jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
}

export function isGroupJid(jid = '') {
  return jid.endsWith('@g.us');
}

export function isLidJid(jid = '') {
  return jid.endsWith('@lid');
}

export function jidToNumber(jid = '') {
  return jid.split('@')[0].split(':')[0];
}

export function decodeSender(msg) {
  const from = msg.key.remoteJid;
  const isGroup = isGroupJid(from);

  let sender = isGroup ? (msg.key.participant || msg.participant) : from;

  if (isLidJid(sender) && msg.key.participantAlt) {
    sender = msg.key.participantAlt;
  } else if (isLidJid(from) && msg.key.remoteJidAlt) {
    sender = msg.key.remoteJidAlt;
  }

  sender = normalizeJid(sender);

  return {
    from,
    sender,
    isGroup,
    senderNumber: jidToNumber(sender),
  };
}

export function isOwner(jid = '', ownerList = []) {
  const num = jidToNumber(jid);
  return ownerList.some((o) => o.replace(/\D/g, '') === num);
}