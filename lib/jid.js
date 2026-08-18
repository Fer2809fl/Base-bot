'use strict';

/**
 * Sistema de JID: normaliza, detecta y decodifica remitentes.
 * Contempla el caso de jids ocultos (@lid) que WhatsApp usa en algunos grupos/canales.
 */

function normalizeJid(jid = '') {
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

function isGroupJid(jid = '') {
  return jid.endsWith('@g.us');
}

function isLidJid(jid = '') {
  return jid.endsWith('@lid');
}

function jidToNumber(jid = '') {
  return jid.split('@')[0].split(':')[0];
}

/**
 * Extrae from/sender/isGroup de un mensaje, resolviendo el jid real
 * cuando WhatsApp entrega un @lid en vez del número normal.
 */
function decodeSender(msg) {
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

function isOwner(jid = '', ownerList = []) {
  const num = jidToNumber(jid);
  return ownerList.some((o) => o.replace(/\D/g, '') === num);
}

module.exports = {
  normalizeJid,
  isGroupJid,
  isLidJid,
  jidToNumber,
  decodeSender,
  isOwner,
};
