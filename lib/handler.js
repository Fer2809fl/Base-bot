'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import config from '../config.js';
import logger from './logger.js';
import { antilinkCheck } from '../plugins/groups/antilink-handler.js';
import { welcomeHandler } from '../plugins/groups/welcome-handler.js';
import { antifloodCheck } from '../plugins/groups/antiflood.js';
import { storeMessage, antideleteCheck } from '../plugins/groups/antidelete.js';
import { antieditCheck } from '../plugins/groups/antiedit.js';
import { afkMentionHandler } from '../plugins/groups/afk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsPath = path.join(__dirname, '..', 'plugins');
let plugins = [];
const pluginMap = new Map(); // cmd -> plugin (búsqueda O(1))

// ═══════════════════════════════════════════════════════════════
//  JID Utils
// ═══════════════════════════════════════════════════════════════

function normalizeJid(jid = '') {
  if (!jid) return jid;
  if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') ||
      jid.endsWith('@broadcast') || jid.endsWith('@lid')) return jid;
  return jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
}

function isGroupJid(jid = '') { return jid.endsWith('@g.us'); }
function isLidJid(jid = '') { return jid.endsWith('@lid'); }
function jidToNumber(jid = '') { return jid.split('@')[0].split(':')[0]; }

function decodeSender(msg) {
  const from = msg.key.remoteJid;
  const isGrp = isGroupJid(from);
  let sender = isGrp ? (msg.key.participant || msg.participant) : from;
  if (isLidJid(sender) && msg.key.participantAlt) sender = msg.key.participantAlt;
  else if (isLidJid(from) && msg.key.remoteJidAlt) sender = msg.key.remoteJidAlt;
  sender = normalizeJid(sender);
  return { from, sender, isGroup: isGrp, senderNumber: jidToNumber(sender) };
}

function isOwner(jid = '', ownerList = []) {
  const num = jidToNumber(jid);
  return ownerList.some((o) => o.replace(/\D/g, '') === num);
}

// ═══════════════════════════════════════════════════════════════
//  Cache de grupos (TTL 30s)
// ═══════════════════════════════════════════════════════════════

const metaCache = new Map();
const CACHE_TTL = 30_000;

async function getGroupMeta(sock, groupId) {
  const cached = metaCache.get(groupId);
  if (cached && Date.now() - cached.t < CACHE_TTL) return cached.d;
  const meta = await sock.groupMetadata(groupId);
  metaCache.set(groupId, { d: meta, t: Date.now() });
  return meta;
}

// Normalizar JID: extraer solo el número
function extractNumber(jid) {
  if (!jid) return '';
  // Quitar todo después del número: "12345:6789@lid" → "12345"
  return jid.split('@')[0].split(':')[0];
}

function getBotNumber(sock) {
  return extractNumber(sock.user.id);
}

function findParticipant(meta, userId) {
  const userNum = extractNumber(userId);
  const botNum = getBotNumber(null);
  // Buscar por número extraído (funciona con @s.whatsapp.net y @lid)
  return meta.participants.find(p => extractNumber(p.id) === userNum);
}

async function isBotAdmin(sock, groupId) {
  try {
    const meta = await getGroupMeta(sock, groupId);
    const botNum = extractNumber(sock.user.id);
    const p = meta.participants.find(p => extractNumber(p.id) === botNum);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch { return false; }
}

async function isUserAdmin(sock, groupId, userId) {
  try {
    const meta = await getGroupMeta(sock, groupId);
    const p = findParticipant(meta, userId);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch { return false; }
}

async function isSuperAdmin(sock, groupId, userId) {
  try {
    const meta = await getGroupMeta(sock, groupId);
    const p = findParticipant(meta, userId);
    return p?.admin === 'superadmin';
  } catch { return false; }
}

function clearGroupCache(groupId) {
  if (groupId) metaCache.delete(groupId);
  else metaCache.clear();
}

// ═══════════════════════════════════════════════════════════════
//  Plugin Loader
// ═══════════════════════════════════════════════════════════════

export async function loadPlugins() {
  plugins = [];
  pluginMap.clear();

  const categories = fs.readdirSync(pluginsPath)
    .filter((f) => fs.statSync(path.join(pluginsPath, f)).isDirectory());

  for (const category of categories) {
    const dir = path.join(pluginsPath, category);
    const files = fs.readdirSync(dir).filter((f) =>
      f.endsWith('.js') && !f.includes('-handler') && !f.startsWith('_')
    );

    for (const file of files) {
      try {
        const url = `${pathToFileURL(path.join(dir, file)).href}?t=${Date.now()}`;
        const mod = await import(url);
        const plugin = mod.default;
        if (!plugin?.command || !plugin?.run) continue;
        plugin.category = plugin.category || category;
        plugins.push(plugin);
        // Indexar por cada comando para búsqueda O(1)
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        for (const c of cmds) pluginMap.set(c.toLowerCase(), plugin);
      } catch (err) {
        logger.pluginError(file, err);
      }
    }
  }

  logger.pluginLoad(plugins.length, categories.length);
  return plugins;
}

// ═══════════════════════════════════════════════════════════════
//  Message Parser (optimizado)
// ═══════════════════════════════════════════════════════════════

const PREFIXES = config.prefix;
const PREFIX_SET = new Set(PREFIXES);

function extractBody(msg) {
  const m = msg.message;
  if (!m) return '';
  const type = Object.keys(m)[0];
  return m[type]?.text || m[type]?.caption || m.conversation || '';
}

function getPrefix(text) {
  for (const p of PREFIXES) {
    if (text.startsWith(p)) return p;
  }
  return null;
}

function extractMention(msg) {
  const ext = msg.message?.extendedTextMessage;
  if (ext?.contextInfo?.mentionedJid?.length) return ext.contextInfo.mentionedJid[0];
  if (ext?.contextInfo?.quotedMessage) return ext.contextInfo.participant;
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Message Handler (optimizado)
// ═══════════════════════════════════════════════════════════════

export async function handleMessage(sock, msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;

    const { from, sender, isGroup, senderNumber } = decodeSender(msg);

    // ─── Handlers en tiempo real ───
    if (isGroup) {
      const { getGroupConfig } = await import('./database.js');
      const gConfig = getGroupConfig(from);

      // Antilink + Antiflood + AFK
      if (gConfig.antilink) await antilinkCheck(sock, msg, from);
      if (gConfig.antiflood) await antifloodCheck(sock, msg, from);
      await afkMentionHandler(sock, msg, from);

      // Bot off check
      if (gConfig.botOff) return;
    }

    await storeMessage(msg);
    await antideleteCheck(sock, msg);
    await antieditCheck(sock, msg);

    const body = extractBody(msg);
    if (!body) return;

    const prefix = getPrefix(body);
    if (!prefix) return;

    const spaceIdx = body.indexOf(' ');
    const rawCmd = spaceIdx > 0 ? body.slice(prefix.length, spaceIdx) : body.slice(prefix.length);
    const cmd = rawCmd.toLowerCase();
    if (!cmd) return;

    // Búsqueda O(1) con pluginMap
    const plugin = pluginMap.get(cmd);
    if (!plugin) return;

    const args = spaceIdx > 0 ? body.slice(spaceIdx + 1).trim().split(/\s+/) : [];
    const owner = isOwner(sender, config.ownerNumber);

    // ─── Logger ───
    logger.command(cmd, senderNumber, isGroup, args);

    // ─── Validación de permisos (rápida) ───
    if (plugin.ownerOnly && !owner) {
      return sock.sendMessage(from, { text: '⛔ Solo el owner.' }, { quoted: msg });
    }
    if (plugin.group && !isGroup) {
      return sock.sendMessage(from, { text: '⛔ Solo en grupos.' }, { quoted: msg });
    }
    if (plugin.private && isGroup) {
      return sock.sendMessage(from, { text: '⛔ Solo en privado.' }, { quoted: msg });
    }
    if (plugin.admin && isGroup) {
      const admin = await isUserAdmin(sock, from, sender);
      if (!admin && !owner) {
        return sock.sendMessage(from, { text: '⛔ Solo admins.' }, { quoted: msg });
      }
    }
    if (plugin.superAdmin && isGroup) {
      const sa = await isSuperAdmin(sock, from, sender);
      if (!sa && !owner) {
        return sock.sendMessage(from, { text: '⛔ Solo el superadmin.' }, { quoted: msg });
      }
    }
    if (plugin.botAdmin && isGroup) {
      const ba = await isBotAdmin(sock, from);
      if (!ba) {
        return sock.sendMessage(from, { text: '⛔ Necesito ser admin.' }, { quoted: msg });
      }
    }
    if (plugin.argsRequired && args.length === 0) {
      return sock.sendMessage(from, { text: `📝 ${plugin.usage || 'Faltan argumentos.'}` }, { quoted: msg });
    }

    // ─── Ejecutar ───
    const target = extractMention(msg);
    await plugin.run({
      sock, m: msg, from, sender, senderNumber,
      isGroup, isOwner: owner, prefix, command: cmd,
      args, text: args.join(' '), config, target,
      isUserAdmin: isGroup ? () => isUserAdmin(sock, from, sender) : () => Promise.resolve(false),
      isBotAdmin: isGroup ? () => isBotAdmin(sock, from) : () => Promise.resolve(false),
      getGroupMeta: isGroup ? () => getGroupMeta(sock, from) : () => Promise.resolve(null),
    });

    // Limpiar cache tras comandos modificadores
    if (plugin.group) clearGroupCache(from);

  } catch (err) {
    logger.error('Error en handler:', err.message || err);
  }
}

export function getPlugins() { return plugins; }
export { welcomeHandler };
