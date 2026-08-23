'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { getPlugins } from '../../lib/handler.js';
import {
  uptime,
  boxOpen,
  boxClose,
  boxLine,
  categoryHeader,
  categoryFooter,
  cmdItem,
  divider,
  splitText,
  uiBox,
  uiLine,
  uiRaw,
  uiSep,
} from '../../lib/style.js';
import config from '../../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { version } = require(path.join(__dirname, '..', '..', 'package.json'));

export default {
  command: ['menu', 'menú', 'help', 'ayuda', 'comandos'],
  category: 'general',
  description: 'Muestra todos los comandos disponibles',
  run: async ({ sock, m, from, prefix, sender }) => {
    const categorias = new Map();
    const vistos = new Set();

    const p = prefix;
    const botname = config.botName || 'Asta';
    const ownername = config.ownerNumber?.[0] || '—';
    const userNum = sender.split('@')[0] ?? sender;

    // Logo del bot (si existe en config)
    const logoUrl = config.globalLogo || config.logoPath || null;

    // Contar usuarios desde economy.json
    let usersCount = '—';
    let totalCmds = 0;
    try {
      const dbPath = path.join(process.cwd(), 'db', 'db.json');
      if (fs.existsSync(dbPath)) {
        const raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        usersCount = String(Object.keys(raw.economy?.users || {}).length);
      }
    } catch {}

    // Agrupar comandos
    for (const plugin of getPlugins()) {
      const name = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
      if (vistos.has(name)) continue;
      vistos.add(name);
      const cat = plugin.category ?? 'general';
      if (!categorias.has(cat)) categorias.set(cat, []);
      categorias.get(cat).push(plugin);
      totalCmds++;
    }

    // ─── Header (estilo menu.ts) ───
    const header =
      `「✦」*¡Hola!* @${userNum}. *Soy* ${botname}*, aquí tienes la lista de comandos (๑•ᴗ•๑).*\n\n` +
      `${boxOpen()}\n` +
      `${boxLine('OWNER', ownername)}\n` +
      `${boxLine('BOT NAME', botname)}\n` +
      `${boxLine('TYPE', 'Bot WhatsApp')}\n` +
      `${boxLine('VERSIÓN', version)}\n` +
      `${boxLine('SISTEMA', process.platform)}\n` +
      `${boxLine('UPTIME', uptime())}\n` +
      `${boxLine('USERS', usersCount)}\n` +
      `${boxLine('COMANDOS', `${totalCmds}`)}\n` +
      `${boxClose()}\n` +
      `${divider()}\n\n` +
      `「🌟」*LISTA DE COMANDOS::*\n\n`;

    // ─── Body — categorías (estilo menu.ts) ───
    const bodyList = [];
    const iconos = {
      general: '⚙️ GENERAL ⚔️',
      economy: '💰 ECONOMÍA 🪙',
      tools: '🛠️ HERRAMIENTAS 🧰',
      descargas: '📥 DESCARGAS ⬇️',
      grupo: '👥 GRUPOS 💬',
      gacha: '🎴 GACHA 💞',
      admin: '🛡️ ADMIN 👑',
      owner: '👑 OWNER 🔒',
    };

    for (const [cat, cmds] of categorias) {
      const icono = iconos[cat] ?? `📁 ${cat.toUpperCase()}`;
      bodyList.push(categoryHeader(icono));
      for (const plugin of cmds) {
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        const shortest = cmds.reduce((a, b) => a.length <= b.length ? a : b);
        const name = plugin.ownerOnly ? `${shortest} 👑` : shortest;
        bodyList.push(cmdItem(p, name, plugin.description || ''));
      }
      bodyList.push(categoryFooter(botname));
      bodyList.push('');
    }

    const fullText = header + bodyList.join('\n');

    // ─── Botones nativos (estilo menu.ts) ───
    const nativeButtons = [];

    // El canal se enviará como tarjeta newsletter después del menú
    if (config.grupo) {
      nativeButtons.push({
        name: 'cta_url',
        params: { display_text: '👥 Grupo', url: config.grupo, merchant_url: config.grupo },
      });
    }
    if (config.webUrl) {
      nativeButtons.push({
        name: 'cta_url',
        params: { display_text: '🌐 Web', url: config.webUrl, merchant_url: config.webUrl },
      });
    }
    nativeButtons.push({
      name: 'quick_reply',
      params: { display_text: '🤖 Sub-Bot', id: `${p}code` },
    });

    // ─── Enviar (estilo menu.ts con fallbacks) ───
    try {
      // Intentar enviar con botones nativos + imagen
      const hasImage = logoUrl && fs.existsSync(logoUrl);
      const imagePayload = hasImage ? fs.readFileSync(logoUrl) : undefined;

      if (sock.sendMixedButtons) {
        await sock.sendMixedButtons(from, fullText, nativeButtons, {
          footer: botname,
          image: imagePayload,
          quoted: m,
        });
      } else if (hasImage) {
        await sock.sendMessage(from, {
          image: imagePayload,
          caption: fullText,
          mentions: [sender],
        }, { quoted: m });
      } else {
        await sock.sendMessage(from, { text: fullText, mentions: [sender] }, { quoted: m });
      }
    } catch (err) {
      console.warn('⚠️ [Menu] Error enviando menú:', err.message);
      try {
        // Fallback: texto sin imagen ni botones
        const parts = splitText(fullText);
        for (const part of parts) {
          await sock.sendMessage(from, { text: part, mentions: [sender] }, { quoted: m });
        }
      } catch (err2) {
        console.warn('⚠️ [Menu] Fallback también falló:', err2.message);
      }
    }

    // ─── Tarjeta Newsletter (canal) ───
    if (config.channelId || config.chanel) {
      try {
        const channelId = (config.channelId || '').replace('@newsletter', '');
        const channelUrl = `https://whatsapp.com/channel/${channelId}`;
        const channelName = config.channelName || 'Canal Oficial';
        await sock.sendMessage(from, {
          text: `「📢」*¡Únete a nuestro canal oficial!*

💫 *${channelName}*
Todas las novedades, actualizaciones y contenido exclusivo aquí 👇`,
          contextInfo: {
            externalAdReply: {
              title: channelName,
              body: 'Canal oficial de WhatsApp — Noticias y actualizaciones del bot.',
              sourceUrl: channelUrl,
            },
          },
        }, { quoted: m });
      } catch (err) {
        console.warn('⚠️ [Menu] Error enviando tarjeta newsletter:', err.message);
      }
    }
  },
};
