'use strict';

// ─── Colores ANSI ───
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

// ─── Niveles de log ───
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SUCCESS: 4,
};

let currentLevel = LEVELS.INFO;

function getTimestamp() {
  return new Date().toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function formatLevel(level) {
  switch (level) {
    case 'DEBUG':   return `${C.dim}${pad(level, 7)}${C.reset}`;
    case 'INFO':    return `${C.cyan}${pad(level, 7)}${C.reset}`;
    case 'WARN':    return `${C.yellow}${pad(level, 7)}${C.reset}`;
    case 'ERROR':   return `${C.red}${pad(level, 7)}${C.reset}`;
    case 'SUCCESS': return `${C.green}${pad(level, 7)}${C.reset}`;
    default:        return pad(level, 7);
  }
}

function log(level, ...args) {
  const ts = `${C.dim}${getTimestamp()}${C.reset}`;
  const lvl = formatLevel(level);
  console.log(`[${ts}] [${lvl}]`, ...args);
}

// ─── Logger principal ───
const logger = {
  debug: (...args) => { if (currentLevel <= LEVELS.DEBUG) log('DEBUG', ...args); },
  info: (...args) => { if (currentLevel <= LEVELS.INFO) log('INFO', ...args); },
  warn: (...args) => { if (currentLevel <= LEVELS.WARN) log('WARN', ...args); },
  error: (...args) => { if (currentLevel <= LEVELS.ERROR) log('ERROR', ...args); },
  success: (...args) => { if (currentLevel <= LEVELS.SUCCESS) log('SUCCESS', ...args); },

  setLevel: (level) => { currentLevel = LEVELS[level] ?? LEVELS.INFO; },

  // ─── Logs específicos del bot ───
  command: (cmd, senderNumber, isGroup, args = []) => {
    const ts = `${C.dim}${getTimestamp()}${C.reset}`;
    const tag = isGroup ? `${C.bgBlue}${C.bold} GRUPO ${C.reset}` : `${C.bgMagenta}${C.bold}  DM   ${C.reset}`;
    const cmdStr = `${C.bold}${C.green}.${cmd}${C.reset}`;
    const userStr = `${C.cyan}@${senderNumber}${C.reset}`;
    const argsStr = args.length > 0 ? `${C.dim}→ ${args.join(' ')}${C.reset}` : '';

    console.log(`[${ts}] [${tag}] ${cmdStr} ${userStr} ${argsStr}`);
  },

  pluginLoad: (count, categories) => {
    const ts = `${C.dim}${getTimestamp()}${C.reset}`;
    console.log(`[${ts}] [${C.green}SUCCESS${C.reset}] ${C.bold}${C.green}${count}${C.reset} comando(s) cargado(s) en ${C.bold}${C.cyan}${categories}${C.reset} categoría(s)`);
  },

  pluginError: (filePath, err) => {
    const ts = `${C.dim}${getTimestamp()}${C.reset}`;
    console.error(`[${ts}] [${C.red} ERROR ${C.reset}] Plugin: ${C.yellow}${filePath}${C.reset}`);
    console.error(`  └─ ${C.red}${err.message || err}${C.reset}`);
  },

  connection: (status, detail = '') => {
    const ts = `${C.dim}${getTimestamp()}${C.reset}`;
    switch (status) {
      case 'open':
        console.log(`[${ts}] [${C.bgGreen}${C.bold}  OK  ${C.reset}] ${C.green}Bot conectado${C.reset} ${detail}`);
        break;
      case 'close':
        console.log(`[${ts}] [${C.bgYellow}${C.bold} WARN ${C.reset}] ${C.yellow}Conexión cerrada${C.reset} ${detail}`);
        break;
      case 'reconnect':
        console.log(`[${ts}] [${C.bgBlue}${C.bold}RETRY ${C.reset}] ${C.blue}Reconectando...${C.reset} ${detail}`);
        break;
      case 'logout':
        console.log(`[${ts}] [${C.bgRed}${C.bold} FATAL${C.reset}] ${C.red}Sesión cerrada${C.reset} ${detail}`);
        break;
    }
  },

  startup: (botName) => {
    const ts = `${C.dim}${getTimestamp()}${C.reset}`;
    console.log('');
    console.log(`${C.bold}${C.green}╔══════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.green}║   🤖 ${botName} Bot Iniciando...     ║${C.reset}`);
    console.log(`${C.bold}${C.green}╚══════════════════════════════════════╝${C.reset}`);
    console.log(`[${ts}] [${C.cyan} INFO ${C.reset}] Logger activo - nivel: ${C.bold}${C.green}${Object.keys(LEVELS)[currentLevel]}${C.reset}`);
  },
};

export default logger;
export { logger };
