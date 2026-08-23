'use strict';

import { addMoney, addXp, checkCooldown, getCooldownRemaining } from '../../lib/database.js';
import { boxTop, boxItem, boxItemBold, boxBottom, money, time, S } from '../../lib/style.js';

const COOLDOWN = 24 * 60 * 60 * 1000;
const REWARD_MIN = 100;
const REWARD_MAX = 500;
const XP = 25;

export default {
  command: ['daily', 'diario'],
  category: 'economy',
  description: 'Reclama tu recompensa diaria (24h)',
  cooldown: '24h',
  run: async ({ sock, m, from, sender }) => {
    const remaining = getCooldownRemaining(sender, 'dailyLast', COOLDOWN);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${S.clock} Cooldown: *${time(remaining)}*` }, { quoted: m });
      return;
    }

    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    checkCooldown(sender, 'dailyLast', COOLDOWN);
    addMoney(sender, reward);
    const lvl = addXp(sender, XP);

    let text = `${boxTop('🎁 RECOMPENSA DIARIA')}\n`;
    text += `${boxItemBold('Recompensa', money(reward))}\n`;
    text += `${boxItemBold('XP', `+${XP}`)}\n`;
    if (lvl.leveledUp) text += `${boxItemBold('¡NIVEL UP!', `${lvl.newLevel}`)}\n`;
    text += `${boxBottom()}\n\n`;
    text += `${S.clock} Vuelve en: *24h*\n`;
    text += `✦ · · · · · · · · · · · · · · · ✦\n`;
    text += `⚔️ *ASTA BOT*\n`;
    text += `✦ · · · · · · · · · · · · · · · ✦`;

    await sock.sendMessage(from, { text }, { quoted: m });
  },

  runAllw: async (ctx) => {
    const remaining = getCooldownRemaining(ctx.sender, 'dailyLast', COOLDOWN);
    if (remaining > 0) return null;
    const reward = Math.floor(Math.random() * (REWARD_MAX - REWARD_MIN + 1)) + REWARD_MIN;
    checkCooldown(ctx.sender, 'dailyLast', COOLDOWN);
    addMoney(ctx.sender, reward);
    const lvl = addXp(ctx.sender, XP);
    return `🎁 *Daily*: +${money(reward)}${lvl.leveledUp ? ` 🆕 Nv.${lvl.newLevel}` : ''}`;
  },
};
