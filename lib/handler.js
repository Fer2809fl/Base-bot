'use strict';

const fs = require('fs');
const path = require('path');
const { decodeSender, isOwner } = require('./jid');
const config = require('../config');

const pluginsPath = path.join(__dirname, '..', 'plugins');
let plugins = [];

/**
 * Recorre plugins/<categoria>/*.js y los carga en memoria.
 * La carpeta define la categoría por defecto del comando.
 */
function loadPlugins() {
  plugins = [];

  const categories = fs
    .readdirSync(pluginsPath)
    .filter((f) => fs.statSync(path.join(pluginsPath, f)).isDirectory());

  for (const category of categories) {
    const dir = path.join(pluginsPath, category);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        delete require.cache[require.resolve(filePath)];
        const plugin = require(filePath);

        if (!plugin || !plugin.command || !plugin.run) {
          console.warn(`⚠️ Plugin inválido, se ignora: ${filePath}`);
          continue;
        }

        plugin.category = plugin.category || category;
        plugin.filePath = filePath;
        plugins.push(plugin);
      } catch (err) {
        console.error(`❌ Error cargando plugin ${filePath}:`, err);
      }
    }
  }

  console.log(`✅ ${plugins.length} comando(s) cargado(s) en ${categories.length} categoría(s).`);
  return plugins;
}

function getPrefix(text = '') {
  return config.prefix.find((p) => text.startsWith(p)) || null;
}

function extractBody(msg) {
  const type = Object.keys(msg.message || {})[0];
  switch (type) {
    case 'conversation':
      return msg.message.conversation;
    case 'extendedTextMessage':
      return msg.message.extendedTextMessage.text;
    case 'imageMessage':
      return msg.message.imageMessage.caption || '';
    case 'videoMessage':
      return msg.message.videoMessage.caption || '';
    default:
      return '';
  }
}

async function handleMessage(sock, msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;

    const body = extractBody(msg);
    if (!body) return;

    const prefix = getPrefix(body);
    if (!prefix) return;

    const [rawCmd, ...args] = body.slice(prefix.length).trim().split(/\s+/);
    const cmd = (rawCmd || '').toLowerCase();
    if (!cmd) return;

    const plugin = plugins.find((p) => p.command.includes(cmd));
    if (!plugin) return;

    const { from, sender, isGroup, senderNumber } = decodeSender(msg);
    const owner = isOwner(sender, config.ownerNumber);

    if (plugin.owner && !owner) {
      await sock.sendMessage(from, { text: '⛔ Este comando es solo para el owner.' }, { quoted: msg });
      return;
    }

    if (plugin.group && !isGroup) {
      await sock.sendMessage(from, { text: '⛔ Este comando solo funciona en grupos.' }, { quoted: msg });
      return;
    }

    const ctx = {
      sock,
      m: msg,
      from,
      sender,
      senderNumber,
      isGroup,
      isOwner: owner,
      prefix,
      command: cmd,
      args,
      text: args.join(' '),
      config,
    };

    await plugin.run(ctx);
  } catch (err) {
    console.error('❌ Error en el handler:', err);
  }
}

module.exports = {
  loadPlugins,
  handleMessage,
  getPlugins: () => plugins,
};
