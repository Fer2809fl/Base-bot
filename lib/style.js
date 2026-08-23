'use strict';

// ═══════════════════════════════════════════════════════════════
//  ⚔️ ASTA BOT - Sistema de Estilos「 Grimorio 」
// ═══════════════════════════════════════════════════════════════

const S = {
  // ─── Símbolos decorativos ───
  star: '「✦」',
  starFull: '「★」',
  starEmpty: '「☆」',
  diamond: '「◆」',
  diamondEmpty: '「◇」',
  heart: '「♥」',
  heartEmpty: '「♡」',
  dot: '「●」',
  dotEmpty: '「○」',
  arrow: '「→」',
  arrowLeft: '「←」',
  cross: '「✗」',
  check: '「✓」',
  plus: '「+」',
  minus: '「-」',
  slash: '「/」',
  pipe: '「│」',

  // ─── Líneas decorativas ───
  line: '│',
  lineThin: '───────────',
  lineStar: '✦ · · · · · · · · · · · · · · · ✦',

  // ─── Emojis de estado ───
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  clock: '⏰',
  money: '💰',
  gem: '💎',
  fire: '🔥',
  lightning: '⚡',
  shield: '🛡️',
  sword: '⚔️',
  crown: '👑',
  trophy: '🏆',
  star2: '⭐',
  heart2: '❤️',
  skull: '💀',
  rocket: '🚀',
  lock: '🔒',
  unlock: '🔓',
  gift: '🎁',
  box: '📦',
  bag: '🎒',
  cart: '🛒',
  hammer: '🔨',
  key: '🔑',
  map: '🗺️',
  target: '🎯',
  hourglass: '⏳',
  seed: '🌱',
  leaf: '🍃',
  snowflake: '❄️',
  sun: '☀️',
  moon: '🌙',
  rainbow: '🌈',
  cloud: '☁️',
  star3: '✨',
  sparkle: '❖',
};

// ═══════════════════════════════════════════════════════════════
//  Cajas estilo Grimorio
// ═══════════════════════════════════════════════════════════════

function boxTop(title = '') {
  if (title) return `╭━━━〔 ${title} 〕━━━╮`;
  return `╭━━━━━━━━━━━━━━━━━━━━━╮`;
}

function boxLine(label, value) {
  if (value !== undefined) return `┃  ${label} › ${value}`;
  return `┃  ${label}`;
}

function boxItem(text) {
  return `┃  ${S.sparkle}    ⟶ ${text}`;
}

function boxItemBold(label, value) {
  return `┃  ${S.sparkle}    ⟶ *${label}:* ${value}`;
}

function boxBottom() {
  return `╰━━━━━━━━━━━━━━━━━━━━━╯`;
}

// ═══════════════════════════════════════════════════════════════
//  Headers
// ═══════════════════════════════════════════════════════════════

function header(title, emoji = '⚔️') {
  return `${boxTop(`${emoji} ${title} ✦  ✦ ${emoji}`)}`;
}

function headerSmall(title, emoji = '✦') {
  return `━━━〔 ${emoji} ${title} ${emoji} 〕━━━`;
}

function section(title, emoji = '◆') {
  return `\n${emoji} *${title}*\n${'─'.repeat(30)}`;
}

function sectionDot(title, emoji = '●') {
  return `\n${emoji} *${title}*\n${'· · · · · · · · · · · · · · ·'}`;
}

// ═══════════════════════════════════════════════════════════════
//  Elementos de línea
// ═══════════════════════════════════════════════════════════════

function line(label, value) {
  return `┃  ${S.sparkle}    ⟶ *${label}:* ${value}`;
}

function lineEmpty(label) {
  return `┃  ${S.sparkle}    ⟶ ${label}`;
}

function bullet(text) {
  return `┃  ${S.sparkle}    ⟶ ${text}`;
}

function bulletSimple(text) {
  return `┃  · ${text}`;
}

function bulletDot(text) {
  return `┃  ${S.dot} ${text}`;
}

function bulletCheck(text) {
  return `┃  ${S.check} ${text}`;
}

function bulletCross(text) {
  return `┃  ${S.cross} ${text}`;
}

function item(text) {
  return `┃      └ ${text}`;
}

// ═══════════════════════════════════════════════════════════════
//  Barras de progreso
// ═══════════════════════════════════════════════════════════════

function bar(current, max, length = 10, filled = '█', empty = '░') {
  const f = Math.round((current / max) * length);
  const e = length - f;
  return `${filled.repeat(f)}${empty.repeat(e)}`;
}

function barPercent(current, max, length = 10) {
  const percent = Math.round((current / max) * 100);
  return `${bar(current, max, length)} ${percent}%`;
}

function barLabel(label, current, max, length = 10) {
  return `${label} ${bar(current, max, length)} ${current}/${max}`;
}

// ═══════════════════════════════════════════════════════════════
//  Formateo de datos
// ═══════════════════════════════════════════════════════════════

function money(amount) {
  return `$${amount.toLocaleString('es-ES')}`;
}

function time(ms) {
  if (ms <= 0) return '✅ Listo';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function user(number) {
  return `@${number}`;
}

function level(lv) {
  return `⭐ Nv.${lv}`;
}

function xp(current, needed) {
  return `${S.star3} ${current}/${needed} XP`;
}

// ═══════════════════════════════════════════════════════════════
//  Mensajes predefinidos
// ═══════════════════════════════════════════════════════════════

function error(msg) {
  return `${S.error} *${msg}*`;
}

function success(msg) {
  return `${S.success} *${msg}*`;
}

function warning(msg) {
  return `${S.warning} *${msg}*`;
}

function info(msg) {
  return `${S.info} *${msg}*`;
}

function notEnough(amount) {
  return `${S.error} Necesitas *${money(amount)}* pero no tienes suficiente.`;
}

function cooldown(timeLeft) {
  return `${S.clock} Cooldown: *${time(timeLeft)}*`;
}

// ═══════════════════════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════════════════════

function footer() {
  return `✦ · · · · · · · · · · · · · · · ✦\n⚔️ *ASTA BOT*\n✦ · · · · · · · · · · · · · · · ✦`;
}

function timestamp() {
  return `⏰ ${new Date().toLocaleString('es-ES')}`;
}

// ═══════════════════════════════════════════════════════════════
//  Estilo «ui.ts» — Referencia del diseño
// ═══════════════════════════════════════════════════════════════

function boxOpen() {
  return '╭━━━━━━━━━━━━━━━━━━━━━╮';
}

function boxClose() {
  return '╰━━━━━━━━━━━━━━━━━━━━━╯';
}

function categoryHeader(title) {
  return `\n╭〔 ${title} 〕━━━╮`;
}

function categoryFooter(botName) {
  return `╰━━━━━━━━━━━━━━━━━━━━━╯`;
}

function cmdItem(prefix, name, description) {
  if (description) return `┃  *${prefix}${name}*\n┃  > ${description}`;
  return `┃  *${prefix}${name}*`;
}

function divider() {
  return '· · · · · · · · · · · · · · · · · · · · ·';
}

function uptime() {
  const s = Math.floor(process.uptime());
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function splitText(text, maxLen = 4000) {
  const parts = [];
  for (let i = 0; i < text.length; i += maxLen) {
    parts.push(text.slice(i, i + maxLen));
  }
  return parts;
}

// ═══════════════════════════════════════════════════════════════
//  Funciones «ui.ts» — tarjetas y líneas
// ═══════════════════════════════════════════════════════════════

function uiBox(emoji, title, subtitle, fields, tip) {
  let text = `「${emoji}」 *${title}*`;
  if (subtitle) text += `\n\n  ➥ *${subtitle}*`;
  if (fields?.length) text += `\n\n${fields.join('\n')}`;
  if (tip) text += `\n\n> _${tip}_`;
  return text;
}

function uiLine(label, value) {
  return `  ➥ *${label} ›* ${value}`;
}

function uiRaw(value) {
  return `  ${value}`;
}

function uiSep() {
  return `  ─ ─ ─ ─ ─ ─ ─ ─ ─`;
}

export {
  S,
  boxTop,
  boxLine,
  boxItem,
  boxItemBold,
  boxBottom,
  header,
  headerSmall,
  section,
  sectionDot,
  line,
  lineEmpty,
  bullet,
  bulletSimple,
  bulletDot,
  bulletCheck,
  bulletCross,
  item,
  bar,
  barPercent,
  barLabel,
  money,
  time,
  user,
  level,
  xp,
  error,
  success,
  warning,
  info,
  notEnough,
  cooldown,
  footer,
  timestamp,
  // Nuevo estilo (referencia menu.ts)
  boxOpen,
  boxClose,
  categoryHeader,
  categoryFooter,
  cmdItem,
  divider,
  uptime,
  splitText,
  // Funciones ui.ts
  uiBox,
  uiLine,
  uiRaw,
  uiSep,
};
