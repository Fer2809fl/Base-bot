'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
//  ÚNICO ARCHIVO DB → db/db.json
// ═══════════════════════════════════════════════════════════════
const DB_DIR = path.join(__dirname, '..', 'db');
const DB_PATH = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
//  Carga y guardado OPTIMIZADO (debounced + dirty flag)
// ═══════════════════════════════════════════════════════════════
const db = {
  economy: { users: {} },
  events: { activeEvent: null, lastEvent: 0, eventInterval: 15 * 60 * 1000, claimed: [], activeEffects: [] },
  lottery: { jackpot: 5000, tickets: [], lastDraw: 0, history: [] },
  pets: { users: {} },
  shop: { users: {} },
  properties: { users: {} },
  achievements: { users: {} },
  ranking: { season: 1, seasonStart: Date.now(), seasonEnd: Date.now() + 7 * 24 * 60 * 60 * 1000, rewardsClaimed: false, history: [] },
  groups: {},
};

let dirty = false;
let saveTimeout = null;
const SAVE_DELAY = 1000; // 1 segundo de debounce

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      for (const key of Object.keys(db)) {
        if (data[key]) db[key] = { ...db[key], ...data[key] };
      }
    }
  } catch { /* ignore */ }
}

function scheduleSave() {
  dirty = true;
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    if (!dirty) return;
    dirty = false;
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(db));
    } catch (e) {
      console.error('❌ Error guardando db.json:', e.message);
    }
  }, SAVE_DELAY);
}

// Guardado forzado (parabeforeExit)
function forceSave() {
  if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
  if (!dirty) return;
  dirty = false;
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db));
  } catch {}
}

process.on('SIGINT', forceSave);
process.on('SIGTERM', forceSave);
process.on('beforeExit', forceSave);

load();

// ═══════════════════════════════════════════════════════════════
//  ECONOMY
// ═══════════════════════════════════════════════════════════════

const XP_PER_LEVEL = 100;
function xpForLevel(level) { return level * XP_PER_LEVEL; }

function getUser(userId) {
  if (!db.economy.users[userId]) {
    db.economy.users[userId] = {
      balance: 0, bank: 0, xp: 0, level: 1, totalXp: 0,
      dailyLast: 0, workLast: 0, robLast: 0, crimeLast: 0,
      fishLast: 0, mineLast: 0, huntLast: 0, begLast: 0,
      slotsLast: 0, coinflipLast: 0, lotteryLast: 0,
      heistLast: 0, farmLast: 0, duelLast: 0, chopLast: 0,
      digLast: 0, pizzaLast: 0, courierLast: 0, teachLast: 0,
      investLast: 0, allwLast: 0,
      totalEarned: 0, totalSpent: 0, crimesDone: 0,
      fishCaught: 0, minesMined: 0, huntsDone: 0,
      slotsPlayed: 0, duelsWon: 0, duelsLost: 0,
    };
  }
  const u = db.economy.users[userId];
  const defaults = {
    xp: 0, level: 1, totalXp: 0, totalEarned: 0, totalSpent: 0,
    crimesDone: 0, fishCaught: 0, minesMined: 0, huntsDone: 0,
    slotsPlayed: 0, duelsWon: 0, duelsLost: 0, allwLast: 0,
    investLast: 0, worksDone: 0, slotsJackpots: 0, petsOwned: 0,
    allwCount: 0, givesDone: 0,
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (u[k] === undefined) u[k] = v;
  }
  return u;
}

function addXp(userId, amount) {
  const user = getUser(userId);
  user.xp += amount;
  user.totalXp = (user.totalXp || 0) + amount;
  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level++;
    leveledUp = true;
  }
  scheduleSave();
  return { leveledUp, newLevel: user.level, xp: user.xp, xpNeeded: xpForLevel(user.level) };
}

function getLevelInfo(userId) {
  const user = getUser(userId);
  return { level: user.level, xp: user.xp, xpNeeded: xpForLevel(user.level), totalXp: user.totalXp || 0 };
}

function getBalance(userId) {
  const user = getUser(userId);
  return user.balance + user.bank;
}

function addMoney(userId, amount) {
  const user = getUser(userId);
  user.balance += amount;
  user.totalEarned = (user.totalEarned || 0) + amount;
  scheduleSave();
  return user.balance;
}

function removeMoney(userId, amount) {
  const user = getUser(userId);
  if (user.balance < amount) return false;
  user.balance -= amount;
  user.totalSpent = (user.totalSpent || 0) + amount;
  scheduleSave();
  return true;
}

function deposit(userId, amount) {
  const user = getUser(userId);
  if (user.balance < amount) return false;
  user.balance -= amount;
  user.bank += amount;
  scheduleSave();
  return true;
}

function withdraw(userId, amount) {
  const user = getUser(userId);
  if (user.bank < amount) return false;
  user.bank -= amount;
  user.balance += amount;
  scheduleSave();
  return true;
}

function giveMoney(fromId, toId, amount) {
  const from = getUser(fromId);
  const to = getUser(toId);
  if (from.balance < amount || amount <= 0) return false;
  from.balance -= amount;
  to.balance += amount;
  from.totalSpent = (from.totalSpent || 0) + amount;
  to.totalEarned = (to.totalEarned || 0) + amount;
  scheduleSave();
  return true;
}

function checkCooldown(userId, type, cooldownMs) {
  const user = getUser(userId);
  const last = user[type] || 0;
  const now = Date.now();
  if (now - last < cooldownMs) return { ready: false, remaining: cooldownMs - (now - last) };
  user[type] = now;
  scheduleSave();
  return { ready: true, remaining: 0 };
}

function getCooldownRemaining(userId, type, cooldownMs) {
  const user = getUser(userId);
  const last = user[type] || 0;
  const now = Date.now();
  if (now - last >= cooldownMs) return 0;
  return cooldownMs - (now - last);
}

function getLeaderboard(limit = 10) {
  const users = Object.entries(db.economy.users).map(([id, data]) => ({
    userId: id, total: (data.balance || 0) + (data.bank || 0),
    wallet: data.balance || 0, bank: data.bank || 0,
    level: data.level || 1, xp: data.xp || 0,
  }));
  users.sort((a, b) => b.total - a.total);
  return users.slice(0, limit);
}

function getLevelLeaderboard(limit = 10) {
  const users = Object.entries(db.economy.users).map(([id, data]) => ({
    userId: id, level: data.level || 1, xp: data.xp || 0,
    totalXp: data.totalXp || 0, total: (data.balance || 0) + (data.bank || 0),
  }));
  users.sort((a, b) => b.level - a.level || b.totalXp - a.totalXp);
  return users.slice(0, limit);
}

function formatMoney(amount) { return amount.toLocaleString('es-ES'); }

function formatCooldown(ms) {
  if (ms <= 0) return '✅ Listo';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function getEconomyDb() { return db.economy; }

// ═══════════════════════════════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════════════════════════════

const EVENT_TYPES = [
  { id: 'money_rain', name: 'Lluvia de Dinero', emoji: '🌧️💰', description: '¡Dinero cayendo del cielo!', duration: 5 * 60 * 1000, reward: { min: 50, max: 200 }, xp: 10, chance: 0.25 },
  { id: 'rat_invasion', name: 'Invasión de Ratas', emoji: '🐀⚔️', description: '¡Combate las ratas!', duration: 3 * 60 * 1000, reward: { min: 100, max: 350 }, xp: 20, chance: 0.15 },
  { id: 'treasure_chest', name: 'Cofre del Tesoro', emoji: '🧳✨', description: '¡Un cofre misterioso!', duration: 4 * 60 * 1000, reward: { min: 200, max: 800 }, xp: 30, chance: 0.10 },
  { id: 'xp_bonanza', name: 'Bonanza de XP', emoji: '⚡🌟', description: '¡x2 XP por 10 min!', duration: 10 * 60 * 1000, reward: null, xp: 0, chance: 0.15, effect: 'xpMultiplier', effectValue: 2 },
  { id: 'mystery_gift', name: 'Regalo Misterioso', emoji: '🎁❓', description: '¿Abrir el regalo?', duration: 3 * 60 * 1000, reward: { min: 0, max: 500 }, xp: 15, chance: 0.20 },
  { id: 'dice_battle', name: 'Batalla de Dados', emoji: '🎲⚔️', description: '¡Lanza dados!', duration: 3 * 60 * 1000, reward: { min: 80, max: 300 }, xp: 15, chance: 0.20 },
  { id: 'golden_hour', name: 'Hora Dorada', emoji: '👑✨', description: '¡x3 dinero por 5 min!', duration: 5 * 60 * 1000, reward: null, xp: 0, chance: 0.08, effect: 'moneyMultiplier', effectValue: 3 },
  { id: 'rock_paper', name: 'Piedra Papel Tijera', emoji: '✊🖐️✌️', description: '¡RPS contra el bot!', duration: 3 * 60 * 1000, reward: { min: 60, max: 250 }, xp: 12, chance: 0.18 },
];

function trySpawnEvent() {
  const now = Date.now();
  if (db.events.activeEvent) return null;
  if (now - db.events.lastEvent < db.events.eventInterval) return null;
  const roll = Math.random();
  let cumulative = 0;
  for (const event of EVENT_TYPES) {
    cumulative += event.chance;
    if (roll < cumulative) {
      db.events.activeEvent = { ...event, startedAt: now, expiresAt: now + event.duration };
      db.events.claimed = [];
      db.events.lastEvent = now;
      scheduleSave();
      return db.events.activeEvent;
    }
  }
  db.events.lastEvent = now;
  scheduleSave();
  return null;
}

function getActiveEvent() {
  if (!db.events.activeEvent) return null;
  if (Date.now() > db.events.activeEvent.expiresAt) { db.events.activeEvent = null; save(); return null; }
  return db.events.activeEvent;
}

function claimEvent(userId) {
  const event = getActiveEvent();
  if (!event) return { success: false, error: 'No hay evento activo' };
  if (db.events.claimed.includes(userId)) return { success: false, error: 'Ya reclamaste este evento' };
  db.events.claimed.push(userId);
  if (event.effect) db.events.activeEffects.push({ effect: event.effect, value: event.effectValue, expiresAt: event.expiresAt });
  scheduleSave();
  let reward = 0;
  if (event.reward) reward = Math.floor(Math.random() * (event.reward.max - event.reward.min + 1)) + event.reward.min;
  return { success: true, event, reward, xp: event.xp };
}

function getActiveEffect(effectType) {
  db.events.activeEffects = db.events.activeEffects.filter((e) => Date.now() < e.expiresAt);
  return db.events.activeEffects.find((e) => e.effect === effectType) || null;
}

function forceEvent(eventId) {
  const event = EVENT_TYPES.find((e) => e.id === eventId);
  if (!event) return null;
  db.events.activeEvent = { ...event, startedAt: Date.now(), expiresAt: Date.now() + event.duration };
  db.events.claimed = [];
  db.events.lastEvent = Date.now();
  scheduleSave();
  return db.events.activeEvent;
}

function getEventCatalog() { return EVENT_TYPES; }
function getTimeUntilNextEvent() { return Math.max(0, db.events.eventInterval - (Date.now() - db.events.lastEvent)); }

// ═══════════════════════════════════════════════════════════════
//  LOTTERY
// ═══════════════════════════════════════════════════════════════

const TICKET_PRICE = 200;
const DRAW_INTERVAL = 6 * 60 * 60 * 1000;
const PRIZE_PERCENTAGES = [0.50, 0.25, 0.10, 0.05];

function buyTicket(userId, numbers) {
  if (!Array.isArray(numbers) || numbers.length !== 4) return { success: false, error: 'Necesitas 4 números del 0-9' };
  if (!numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 9)) return { success: false, error: 'Los números deben ser del 0-9' };
  const userTickets = db.lottery.tickets.filter((t) => t.userId === userId);
  if (userTickets.length >= 3) return { success: false, error: 'Máximo 3 tickets por sorteo' };
  db.lottery.tickets.push({ userId, numbers, boughtAt: Date.now() });
  db.lottery.jackpot += Math.floor(TICKET_PRICE * 0.10);
  scheduleSave();
  return { success: true, ticketCount: userTickets.length + 1, jackpot: db.lottery.jackpot };
}

function drawLottery() {
  const now = Date.now();
  if (now - db.lottery.lastDraw < DRAW_INTERVAL) return { success: false, remaining: DRAW_INTERVAL - (now - db.lottery.lastDraw), type: 'cooldown' };
  if (db.lottery.tickets.length === 0) {
    db.lottery.lastDraw = now;
    db.lottery.jackpot += Math.floor(5000 * 0.1);
    scheduleSave();
    return { success: false, type: 'no_tickets', jackpot: db.lottery.jackpot };
  }
  const winningNumbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
  const results = db.lottery.tickets.map((t) => ({ ...t, matches: t.numbers.filter((n, i) => n === winningNumbers[i]).length }));
  results.sort((a, b) => b.matches - a.matches);
  const winners = [];
  let remaining = db.lottery.jackpot;
  for (let i = 0; i < Math.min(results.length, 4); i++) {
    if (results[i].matches < 2) break;
    const prize = Math.floor(remaining * (PRIZE_PERCENTAGES[i] || 0.02));
    winners.push({ userId: results[i].userId, numbers: results[i].numbers, matches: results[i].matches, prize, position: i + 1 });
    remaining -= prize;
  }
  db.lottery.history.unshift({ winningNumbers, winners: winners.map((w) => ({ userId: w.userId, matches: w.matches, prize: w.prize, position: w.position })), jackpot: db.lottery.jackpot, date: now });
  if (db.lottery.history.length > 20) db.lottery.history = db.lottery.history.slice(0, 20);
  db.lottery.tickets = [];
  db.lottery.jackpot = winners.length > 0 ? remaining + 5000 : db.lottery.jackpot + Math.floor(5000 * 0.2);
  db.lottery.lastDraw = now;
  scheduleSave();
  return { success: true, winningNumbers, winners, jackpot: db.lottery.jackpot };
}

function getJackpot() { return db.lottery.jackpot; }
function getTimeUntilDraw() { return Math.max(0, DRAW_INTERVAL - (Date.now() - db.lottery.lastDraw)); }
function getUserTickets(userId) { return db.lottery.tickets.filter((t) => t.userId === userId); }
function getHistory(limit = 5) { return db.lottery.history.slice(0, limit); }
function getTotalTickets() { return db.lottery.tickets.length; }

// ═══════════════════════════════════════════════════════════════
//  PETS
// ═══════════════════════════════════════════════════════════════

const PET_CATALOG = [
  { id: 'gato', name: 'Gato', emoji: '🐱', price: 500, baseIncome: 10, stats: { attack: 3, defense: 2, speed: 5 }, description: 'Un gato curioso y ágil' },
  { id: 'perro', name: 'Perro', emoji: '🐶', price: 400, baseIncome: 8, stats: { attack: 4, defense: 4, speed: 3 }, description: 'Un perro leal y fuerte' },
  { id: 'conejo', name: 'Conejo', emoji: '🐰', price: 300, baseIncome: 5, stats: { attack: 1, defense: 2, speed: 6 }, description: 'Un conejito rápido' },
  { id: 'loro', name: 'Loro', emoji: '🦜', price: 800, baseIncome: 15, stats: { attack: 2, defense: 1, speed: 4 }, description: 'Un loro parlanchín' },
  { id: 'tortuga', name: 'Tortuga', emoji: '🐢', price: 600, baseIncome: 12, stats: { attack: 2, defense: 8, speed: 1 }, description: 'Lenta pero indestructible' },
  { id: 'leon', name: 'León', emoji: '🦁', price: 5000, baseIncome: 50, stats: { attack: 9, defense: 6, speed: 5 }, description: 'El rey de la selva' },
  { id: 'dragon', name: 'Dragón', emoji: '🐉', price: 25000, baseIncome: 200, stats: { attack: 10, defense: 10, speed: 8 }, description: 'Una criatura legendaria' },
  { id: 'fenix', name: 'Fénix', emoji: '🔥', price: 15000, baseIncome: 120, stats: { attack: 8, defense: 7, speed: 9 }, description: 'Renace de sus cenizas' },
  { id: 'lobo', name: 'Lobo', emoji: '🐺', price: 2000, baseIncome: 25, stats: { attack: 7, defense: 5, speed: 6 }, description: 'Feroz y Veloz' },
  { id: 'panda', name: 'Panda', emoji: '🐼', price: 3000, baseIncome: 30, stats: { attack: 5, defense: 7, speed: 3 }, description: 'Adorable pero fuerte' },
  { id: 'robot', name: 'Robot', emoji: '🤖', price: 10000, baseIncome: 80, stats: { attack: 7, defense: 9, speed: 4 }, description: 'Mascota mecánica del futuro' },
  { id: 'unicornio', name: 'Unicornio', emoji: '🦄', price: 50000, baseIncome: 350, stats: { attack: 6, defense: 8, speed: 10 }, description: 'Mágico y majestuoso' },
];

const FOOD_TYPES = [
  { id: 'comida', name: 'Comida básica', emoji: '🍖', price: 50, happiness: 10, energy: 15 },
  { id: 'croquetas', name: 'Croquetas premium', emoji: '🦴', price: 100, happiness: 20, energy: 25 },
  { id: 'pescado', name: 'Pescado fresco', emoji: '🐟', price: 150, happiness: 30, energy: 20 },
  { id: 'filete', name: 'Filete wagyu', emoji: '🥩', price: 300, happiness: 50, energy: 40 },
  { id: 'diamante', name: 'Comida de diamante', emoji: '💎', price: 1000, happiness: 100, energy: 80 },
];

function getUserPets(userId) {
  if (!db.pets.users[userId]) db.pets.users[userId] = { pets: [], lastIncomeCollect: 0 };
  return db.pets.users[userId];
}

function adoptPet(userId, petId, customName = null) {
  const template = PET_CATALOG.find((p) => p.id === petId);
  if (!template) return { success: false, error: 'Mascota no encontrada en el catálogo' };
  const userPets = getUserPets(userId);
  if (userPets.pets.length >= 5) return { success: false, error: 'Máximo 5 mascotas' };
  if (userPets.pets.find((p) => p.id === petId)) return { success: false, error: 'Ya tienes esta mascota' };
  const pet = {
    id: template.id, name: customName || template.name, emoji: template.emoji,
    level: 1, xp: 0, happiness: 100, energy: 100,
    attack: template.stats.attack, defense: template.stats.defense, speed: template.stats.speed,
    baseIncome: template.baseIncome, lastFed: Date.now(), lastBattle: 0,
  };
  userPets.pets.push(pet);
  scheduleSave();
  return { success: true, pet, template };
}

function feedPet(userId, petIndex, foodId) {
  const food = FOOD_TYPES.find((f) => f.id === foodId);
  if (!food) return { success: false, error: 'Comida no encontrada' };
  const userPets = getUserPets(userId);
  const pet = userPets.pets[petIndex];
  if (!pet) return { success: false, error: 'Mascota no encontrada' };
  pet.happiness = Math.min(100, pet.happiness + food.happiness);
  pet.energy = Math.min(100, pet.energy + food.energy);
  pet.lastFed = Date.now();
  pet.xp += 5;
  const xpNeeded = pet.level * 50;
  if (pet.xp >= xpNeeded) {
    pet.xp -= xpNeeded;
    pet.level++;
    pet.attack += 1; pet.defense += 1; pet.speed += 1; pet.baseIncome += 5;
  }
  scheduleSave();
  return { success: true, pet, food, leveledUp: pet.xp >= xpNeeded };
}

function battlePets(userId, petIndex, targetId, targetPetIndex) {
  const userPets = getUserPets(userId);
  const attacker = userPets.pets[petIndex];
  if (!attacker) return { success: false, error: 'Tu mascota no existe' };
  const targetPets = getUserPets(targetId);
  const defender = targetPets.pets[targetPetIndex];
  if (!defender) return { success: false, error: 'La mascota rival no existe' };
  const now = Date.now();
  if (now - attacker.lastBattle < 10 * 60 * 1000) return { success: false, error: 'Tu mascota necesita descansar (10min cooldown)' };
  const atkPower = attacker.attack * 2 + attacker.speed + attacker.happiness / 10;
  const defPower = defender.defense * 2 + defender.speed + defender.happiness / 10;
  const winner = atkPower + Math.random() * 10 > defPower + Math.random() * 10;
  attacker.lastBattle = now;
  attacker.happiness = Math.max(0, attacker.happiness - 10);
  if (winner) {
    attacker.xp += 20;
    const xpNeeded = attacker.level * 50;
    if (attacker.xp >= xpNeeded) {
      attacker.xp -= xpNeeded;
      attacker.level++;
      attacker.attack += 1; attacker.defense += 1; attacker.speed += 1;
    }
  }
  defender.happiness = Math.max(0, defender.happiness - 15);
  scheduleSave();
  return { success: true, attacker, defender, winner, reward: winner ? 100 : 0 };
}

function collectIncome(userId) {
  const userPets = getUserPets(userId);
  const now = Date.now();
  const COOLDOWN = 30 * 60 * 1000;
  if (now - userPets.lastIncomeCollect < COOLDOWN) return { success: false, remaining: COOLDOWN - (now - userPets.lastIncomeCollect) };
  if (userPets.pets.length === 0) return { success: false, error: 'No tienes mascotas' };
  let totalIncome = 0;
  for (const pet of userPets.pets) {
    const happinessBonus = pet.happiness / 100;
    totalIncome += Math.floor(pet.baseIncome * (1 + pet.level * 0.1) * happinessBonus);
  }
  userPets.lastIncomeCollect = now;
  scheduleSave();
  return { success: true, totalIncome, count: userPets.pets.length };
}

function getPets(userId) { return getUserPets(userId).pets; }
function getPet(userId, index) { return getUserPets(userId).pets[index] || null; }
function getPetCatalog() { return PET_CATALOG; }
function getFoodCatalog() { return FOOD_TYPES; }
function getPetFood(foodId) { return FOOD_TYPES.find((f) => f.id === foodId) || null; }

// ═══════════════════════════════════════════════════════════════
//  SHOP
// ═══════════════════════════════════════════════════════════════

const VIP_LEVELS = [
  { level: 1, name: 'VIP Bronce', emoji: '🥉', discount: 10, dailyBonus: 100, xpBonus: 0.1, color: '#CD7F32' },
  { level: 2, name: 'VIP Plata', emoji: '🥈', discount: 15, dailyBonus: 250, xpBonus: 0.2, color: '#C0C0C0' },
  { level: 3, name: 'VIP Oro', emoji: '🥇', discount: 20, dailyBonus: 500, xpBonus: 0.3, color: '#FFD700' },
  { level: 4, name: 'VIP Diamante', emoji: '💎', discount: 25, dailyBonus: 1000, xpBonus: 0.4, color: '#B9F2FF' },
  { level: 5, name: 'VIP Legendario', emoji: '👑', discount: 30, dailyBonus: 2500, xpBonus: 0.5, color: '#FF6B6B' },
];

const SHOP_CATALOG = [
  { id: 'xpboost2x', name: 'XP Boost x2', emoji: '✨', price: 500, category: 'boosts', description: 'Dobla tu XP por 30 min', duration: 30 * 60 * 1000, effect: 'xpMultiplier', value: 2 },
  { id: 'xpboost5x', name: 'XP Boost x5', emoji: '⚡', price: 1500, category: 'boosts', description: 'Quíntuple tu XP por 15 min', duration: 15 * 60 * 1000, effect: 'xpMultiplier', value: 5 },
  { id: 'luckboost', name: 'Suerte +50%', emoji: '🍀', price: 800, category: 'boosts', description: '+50% suerte en crímenes/robos por 20 min', duration: 20 * 60 * 1000, effect: 'luckBoost', value: 0.5 },
  { id: 'shield', name: 'Escudo', emoji: '🛡️', price: 1000, category: 'boosts', description: 'Protege de robos por 1 hora', duration: 60 * 60 * 1000, effect: 'shield', value: 1 },
  { id: 'megaboot', name: 'Mega Boost x10', emoji: '🔥', price: 5000, category: 'boosts', description: '10x XP por 10 min', duration: 10 * 60 * 1000, effect: 'xpMultiplier', value: 10 },
  { id: 'moneyboost2x', name: 'Money Boost x2', emoji: '💵', price: 2000, category: 'boosts', description: 'Dinero x2 por 30 min', duration: 30 * 60 * 1000, effect: 'moneyMultiplier', value: 2 },
  { id: 'vip1d', name: 'VIP 1 Día', emoji: '👑', price: 2000, category: 'vip', description: 'VIP Bronce por 24h', duration: 24 * 60 * 60 * 1000, effect: 'vip', value: 1 },
  { id: 'vip7d', name: 'VIP 7 Días', emoji: '💎', price: 10000, category: 'vip', description: 'VIP Plata por 7 días', duration: 7 * 24 * 60 * 60 * 1000, effect: 'vip', value: 2 },
  { id: 'vip30d', name: 'VIP 30 Días', emoji: '🏆', price: 30000, category: 'vip', description: 'VIP Oro por 30 días', duration: 30 * 24 * 60 * 60 * 1000, effect: 'vip', value: 3 },
  { id: 'vip90d', name: 'VIP 90 Días', emoji: '💠', price: 75000, category: 'vip', description: 'VIP Diamante por 90 días', duration: 90 * 24 * 60 * 60 * 1000, effect: 'vip', value: 4 },
  { id: 'vip永久', name: 'VIP Permanente', emoji: '🔥', price: 200000, category: 'vip', description: 'VIP Legendario PARA SIEMPRE', duration: 365 * 24 * 60 * 60 * 1000, effect: 'vip', value: 5 },
  { id: 'lockpick', name: 'Ganzúa', emoji: '🔐', price: 300, category: 'utils', description: '+20% éxito en robos por 1h', duration: 60 * 60 * 1000, effect: 'robBonus', value: 0.2 },
  { id: 'map', name: 'Mapa del Tesoro', emoji: '🗺️', price: 400, category: 'utils', description: 'Duplica recompensa de .dig', duration: 0, effect: 'digDouble', value: 2 },
  { id: 'fishingrod', name: 'Caña Premium', emoji: '🎣', price: 600, category: 'utils', description: 'Pescas de mayor calidad por 30 min', duration: 30 * 60 * 1000, effect: 'fishBonus', value: 1.5 },
  { id: 'pickaxe', name: 'Pico Diamante', emoji: '⛏️', price: 700, category: 'utils', description: 'Minerales de mayor calidad por 30 min', duration: 30 * 60 * 1000, effect: 'mineBonus', value: 1.5 },
  { id: 'medkit', name: 'Botiquín', emoji: '🩹', price: 200, category: 'utils', description: 'Recupera $500 al ser atrapado', duration: 0, effect: 'recoverFine', value: 500 },
  { id: ' Lucky Charm', name: 'Amuleto de la Suerte', emoji: '🍀', price: 1500, category: 'utils', description: '+30% suerte en todo por 1h', duration: 60 * 60 * 1000, effect: 'luckBoost', value: 0.3 },
  { id: 'crown', name: 'Corona Real', emoji: '👑', price: 8000, category: 'cosmetics', description: 'Título "Rey" en tu perfil', duration: 0, effect: 'title', value: 'Rey' },
  { id: 'halo', name: 'Halo Dorado', emoji: '😇', price: 6000, category: 'cosmetics', description: 'Título "Santo" en tu perfil', duration: 0, effect: 'title', value: 'Santo' },
  { id: 'fire', name: 'Corona de Fuego', emoji: '🔥', price: 4000, category: 'cosmetics', description: 'Título "Infernal" en tu perfil', duration: 0, effect: 'title', value: 'Infernal' },
  { id: 'skull', name: 'Máscara Calavera', emoji: '💀', price: 3000, category: 'cosmetics', description: 'Título "Siniestro" en tu perfil', duration: 0, effect: 'title', value: 'Siniestro' },
  { id: 'angel', name: 'Alas de Ángel', emoji: '🪽', price: 10000, category: 'cosmetics', description: 'Título "Divino" en tu perfil', duration: 0, effect: 'title', value: 'Divino' },
];

function getInventory(userId) {
  if (!db.shop.users[userId]) db.shop.users[userId] = { items: [], activeBuffs: [], activeVip: null, vipLevel: 0 };
  if (db.shop.users[userId].vipLevel === undefined) db.shop.users[userId].vipLevel = 0;
  return db.shop.users[userId];
}

function buyItem(userId, itemId) {
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'Item no encontrado' };
  const inv = getInventory(userId);
  if (item.effect === 'vip' && inv.activeVip) return { success: false, error: 'Ya tienes VIP activo' };
  if (['xpMultiplier', 'luckBoost', 'shield', 'fishBonus', 'mineBonus', 'moneyMultiplier'].includes(item.effect)) {
    if (inv.activeBuffs.find((b) => b.effect === item.effect)) return { success: false, error: 'Ya tienes un boost activo' };
  }
  if (item.duration === 0 && !['recoverFine'].includes(item.effect)) {
    if (inv.items.find((i) => i.id === itemId)) return { success: false, error: 'Ya tienes este item' };
  }
  const vipLevel = getVipLevel(userId);
  const discount = vipLevel ? vipLevel.discount : 0;
  const finalPrice = Math.floor(item.price * (1 - discount / 100));
  if (item.duration > 0) {
    inv.activeBuffs.push({ id: item.id, effect: item.effect, value: item.value, expiresAt: Date.now() + item.duration });
  } else if (item.effect === 'vip') {
    inv.activeVip = { id: item.id, level: item.value, expiresAt: Date.now() + item.duration };
    inv.vipLevel = item.value;
  } else if (item.effect === 'title') {
    inv.items.push({ id: item.id, effect: item.effect, value: item.value });
  } else {
    inv.items.push({ id: item.id, effect: item.effect, value: item.value, quantity: 1 });
  }
  scheduleSave();
  return { success: true, item, finalPrice, discount };
}

function useItem(userId, itemId) {
  const inv = getInventory(userId);
  const item = inv.items.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'No tienes este item' };
  if (['map', 'medkit'].includes(item.effect)) { inv.items = inv.items.filter((i) => i !== item); save(); }
  return { success: true, item, effect: item.effect, value: item.value };
}

function hasBuff(userId, effectType) {
  const inv = getInventory(userId);
  return inv.activeBuffs.find((b) => b.effect === effectType && Date.now() < b.expiresAt) || null;
}

function isVip(userId) {
  const inv = getInventory(userId);
  return inv.activeVip && Date.now() < inv.activeVip.expiresAt;
}

function getVipLevel(userId) {
  const inv = getInventory(userId);
  if (!inv.activeVip || Date.now() > inv.activeVip.expiresAt) return null;
  return VIP_LEVELS.find((v) => v.level === (inv.vipLevel || 1)) || VIP_LEVELS[0];
}

function getVipInfo(userId) {
  const inv = getInventory(userId);
  if (!inv.activeVip || Date.now() > inv.activeVip.expiresAt) return null;
  const vipData = VIP_LEVELS.find((v) => v.level === (inv.vipLevel || 1)) || VIP_LEVELS[0];
  return { ...vipData, expiresAt: inv.activeVip.expiresAt, remaining: inv.activeVip.expiresAt - Date.now() };
}

function getTitle(userId) {
  const inv = getInventory(userId);
  const titleItem = inv.items.find((i) => i.effect === 'title');
  return titleItem ? titleItem.value : null;
}

function getCatalog(category = null) {
  if (!category) return SHOP_CATALOG;
  return SHOP_CATALOG.filter((i) => i.category === category);
}

function getItem(itemId) { return SHOP_CATALOG.find((i) => i.id === itemId) || null; }
function getVipLevels() { return VIP_LEVELS; }

function formatInventory(userId) {
  const inv = getInventory(userId);
  const result = {
    items: inv.items,
    activeBuffs: inv.activeBuffs.filter((b) => Date.now() < b.expiresAt),
    activeVip: inv.activeVip && Date.now() < inv.activeVip.expiresAt ? inv.activeVip : null,
  };
  inv.activeBuffs = inv.activeBuffs.filter((b) => Date.now() < b.expiresAt);
  scheduleSave();
  return result;
}

function getXpMultiplier(userId) {
  let mult = 1;
  const buff = hasBuff(userId, 'xpMultiplier');
  if (buff) mult *= buff.value;
  const vip = getVipLevel(userId);
  if (vip) mult *= (1 + vip.xpBonus);
  return mult;
}

function getMoneyMultiplier(userId) {
  let mult = 1;
  const buff = hasBuff(userId, 'moneyMultiplier');
  if (buff) mult *= buff.value;
  return mult;
}

// ═══════════════════════════════════════════════════════════════
//  PROPERTIES
// ═══════════════════════════════════════════════════════════════

const PROPERTIES = [
  { id: 'cabaña', name: 'Cabaña de Madera', emoji: '🏚️', price: 2000, category: 'houses', rent: 50, description: 'Una cabaña sencilla en el bosque' },
  { id: 'casa', name: 'Casa Suburbana', emoji: '🏠', price: 8000, category: 'houses', rent: 150, description: 'Casa de 2 habitaciones' },
  { id: 'villa', name: 'Villa Moderna', emoji: '🏡', price: 25000, category: 'houses', rent: 500, description: 'Villa con piscina y jardín' },
  { id: 'penthouse', name: 'Penthouse', emoji: '🏙️', price: 100000, category: 'houses', rent: 2000, description: 'Ático de lujo en el centro' },
  { id: 'castillo', name: 'Castillo', emoji: '🏰', price: 500000, category: 'houses', rent: 10000, description: 'Un castillo completo con torres' },
  { id: 'bici', name: 'Bicicleta', emoji: '🚲', price: 500, category: 'vehicles', rent: 10, description: 'Una bici vieja pero funcional' },
  { id: 'moto', name: 'Motocicleta', emoji: '🏍️', price: 5000, category: 'vehicles', rent: 80, description: 'Moto deportiva' },
  { id: 'carro', name: 'Carro Sedán', emoji: '🚗', price: 15000, category: 'vehicles', rent: 200, description: 'Auto familiar cómodo' },
  { id: 'deportivo', name: 'Auto Deportivo', emoji: '🏎️', price: 50000, category: 'vehicles', rent: 600, description: 'Ferrari rojo de alta gama' },
  { id: 'yate', name: 'Yate', emoji: '🛥️', price: 200000, category: 'vehicles', rent: 3000, description: 'Yate de lujo con tripulación' },
  { id: 'avion', name: 'Avión Privado', emoji: '✈️', price: 1000000, category: 'vehicles', rent: 15000, description: 'Jet privado personalizado' },
  { id: 'puesto', name: 'Puesto de Tacos', emoji: '🌮', price: 3000, category: 'businesses', rent: 100, description: 'Un puesto callejero de tacos' },
  { id: 'restaurante', name: 'Restaurante', emoji: '🍽️', price: 20000, category: 'businesses', rent: 400, description: 'Restaurante italiano de moda' },
  { id: 'bar', name: 'Bar/Cantina', emoji: '🍺', price: 35000, category: 'businesses', rent: 700, description: 'Bar nocturno con música en vivo' },
  { id: 'tienda', name: 'Tienda de Ropa', emoji: '👗', price: 50000, category: 'businesses', rent: 1000, description: 'Boutique de marca' },
  { id: 'hotel', name: 'Hotel', emoji: '🏨', price: 150000, category: 'businesses', rent: 3000, description: 'Hotel de 5 estrellas' },
  { id: 'fabrica', name: 'Fábrica', emoji: '🏭', price: 300000, category: 'businesses', rent: 6000, description: 'Fábrica de productos' },
  { id: 'banco', name: 'Banco Privado', emoji: '🏦', price: 800000, category: 'businesses', rent: 20000, description: 'Tu propio banco personal' },
];

function getUserProps(userId) {
  if (!db.properties.users[userId]) db.properties.users[userId] = { properties: [], lastRentCollect: 0 };
  return db.properties.users[userId];
}

function buyProperty(userId, propId) {
  const prop = PROPERTIES.find((p) => p.id === propId);
  if (!prop) return { success: false, error: 'Propiedad no encontrada' };
  const userProps = getUserProps(userId);
  if (userProps.properties.find((p) => p.id === propId)) return { success: false, error: 'Ya tienes esta propiedad' };
  const sameCategory = userProps.properties.filter((p) => {
    const catalog = PROPERTIES.find((c) => c.id === p.id);
    return catalog && catalog.category === prop.category;
  });
  const limits = { houses: 3, vehicles: 5, businesses: 4 };
  if (sameCategory.length >= (limits[prop.category] || 3)) {
    return { success: false, error: `Límite de ${prop.category} alcanzado (${limits[prop.category]})` };
  }
  userProps.properties.push({ id: propId, boughtAt: Date.now(), rentCollected: 0 });
  scheduleSave();
  return { success: true, property: prop };
}

function sellProperty(userId, propId) {
  const userProps = getUserProps(userId);
  const propIndex = userProps.properties.findIndex((p) => p.id === propId);
  if (propIndex === -1) return { success: false, error: 'No tienes esta propiedad' };
  const prop = PROPERTIES.find((p) => p.id === propId);
  const sellPrice = Math.floor(prop.price * 0.7);
  userProps.properties.splice(propIndex, 1);
  scheduleSave();
  return { success: true, property: prop, sellPrice };
}

function collectRent(userId) {
  const userProps = getUserProps(userId);
  const now = Date.now();
  const COOLDOWN = 60 * 60 * 1000;
  if (now - userProps.lastRentCollect < COOLDOWN) return { success: false, remaining: COOLDOWN - (now - userProps.lastRentCollect) };
  if (userProps.properties.length === 0) return { success: false, error: 'No tienes propiedades' };
  let totalRent = 0;
  for (const owned of userProps.properties) {
    const prop = PROPERTIES.find((p) => p.id === owned.id);
    if (prop) totalRent += prop.rent;
  }
  userProps.lastRentCollect = now;
  scheduleSave();
  return { success: true, totalRent, count: userProps.properties.length };
}

function getProperties(userId) {
  const userProps = getUserProps(userId);
  return userProps.properties.map((owned) => {
    const prop = PROPERTIES.find((p) => p.id === owned.id);
    return { ...owned, ...prop, sellPrice: prop ? Math.floor(prop.price * 0.7) : 0 };
  });
}

function getProperty(propId) { return PROPERTIES.find((p) => p.id === propId) || null; }
function getPropsCatalog(category = null) {
  if (!category) return PROPERTIES;
  return PROPERTIES.filter((p) => p.category === category);
}
function getTotalRentPerHour(userId) {
  const userProps = getUserProps(userId);
  let total = 0;
  for (const owned of userProps.properties) {
    const prop = PROPERTIES.find((p) => p.id === owned.id);
    if (prop) total += prop.rent;
  }
  return total;
}

// ═══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════

const ACHIEVEMENTS = [
  { id: 'first_earn', name: 'Primer Dólar', emoji: '💵', description: 'Gana tu primer dinero', reward: 100, condition: (u) => (u.totalEarned || 0) >= 1 },
  { id: 'earn_1k', name: 'Ahorrador', emoji: '💰', description: 'Acumula $1,000 en total', reward: 200, condition: (u) => (u.totalEarned || 0) >= 1000 },
  { id: 'earn_10k', name: 'Emprendedor', emoji: '📈', description: 'Acumula $10,000 en total', reward: 500, condition: (u) => (u.totalEarned || 0) >= 10000 },
  { id: 'earn_50k', name: 'Magnate', emoji: '🏦', description: 'Acumula $50,000 en total', reward: 2000, condition: (u) => (u.totalEarned || 0) >= 50000 },
  { id: 'earn_100k', name: 'Millonario', emoji: '💎', description: 'Acumula $100,000 en total', reward: 5000, condition: (u) => (u.totalEarned || 0) >= 100000 },
  { id: 'earn_500k', name: 'Tycoon', emoji: '👑', description: 'Acumula $500,000 en total', reward: 25000, condition: (u) => (u.totalEarned || 0) >= 500000 },
  { id: 'earn_1m', name: 'Leyenda', emoji: '🏆', description: 'Acumula $1,000,000 en total', reward: 100000, condition: (u) => (u.totalEarned || 0) >= 1000000 },
  { id: 'level_5', name: 'Aprendiz', emoji: '⭐', description: 'Alcanza nivel 5', reward: 200, condition: (u) => (u.level || 1) >= 5 },
  { id: 'level_10', name: 'Veterano', emoji: '🌟', description: 'Alcanza nivel 10', reward: 500, condition: (u) => (u.level || 1) >= 10 },
  { id: 'level_25', name: 'Experto', emoji: '💫', description: 'Alcanza nivel 25', reward: 2000, condition: (u) => (u.level || 1) >= 25 },
  { id: 'level_50', name: 'Maestro', emoji: '🏅', description: 'Alcanza nivel 50', reward: 10000, condition: (u) => (u.level || 1) >= 50 },
  { id: 'level_100', name: 'Gran Maestro', emoji: '🎖️', description: 'Alcanza nivel 100', reward: 50000, condition: (u) => (u.level || 1) >= 100 },
  { id: 'first_duel', name: 'Primer Duelo', emoji: '⚔️', description: 'Gana tu primer duelo', reward: 100, condition: (u) => (u.duelsWon || 0) >= 1 },
  { id: 'duel_5', name: 'Guerrero', emoji: '🗡️', description: 'Gana 5 duelos', reward: 300, condition: (u) => (u.duelsWon || 0) >= 5 },
  { id: 'duel_10', name: 'Campeón', emoji: '🛡️', description: 'Gana 10 duelos', reward: 1000, condition: (u) => (u.duelsWon || 0) >= 10 },
  { id: 'duel_25', name: 'Invicto', emoji: '🔥', description: 'Gana 25 duelos', reward: 5000, condition: (u) => (u.duelsWon || 0) >= 25 },
  { id: 'first_crime', name: 'Delincuente', emoji: '🦹', description: 'Comete tu primer crimen', reward: 100, condition: (u) => (u.crimesDone || 0) >= 1 },
  { id: 'crime_10', name: 'Criminal', emoji: '🏴', description: 'Comete 10 crímenes', reward: 500, condition: (u) => (u.crimesDone || 0) >= 10 },
  { id: 'crime_50', name: 'Mafioso', emoji: '🎩', description: 'Comete 50 crímenes', reward: 5000, condition: (u) => (u.crimesDone || 0) >= 50 },
  { id: 'first_fish', name: 'Pescador', emoji: '🎣', description: 'Pesca tu primer pez', reward: 50, condition: (u) => (u.fishCaught || 0) >= 1 },
  { id: 'fish_25', name: 'Pescador Experto', emoji: '🐠', description: 'Pesca 25 peces', reward: 500, condition: (u) => (u.fishCaught || 0) >= 25 },
  { id: 'first_mine', name: 'Minero', emoji: '⛏️', description: 'Mina tu primer mineral', reward: 50, condition: (u) => (u.minesMined || 0) >= 1 },
  { id: 'mine_25', name: 'Minero Experto', emoji: '💎', description: 'Mina 25 minerales', reward: 500, condition: (u) => (u.minesMined || 0) >= 25 },
  { id: 'work_10', name: 'Trabajador', emoji: '💼', description: 'Trabaja 10 veces', reward: 300, condition: (u) => (u.worksDone || 0) >= 10 },
  { id: 'work_50', name: 'Empleadazo', emoji: '🏢', description: 'Trabaja 50 veces', reward: 2000, condition: (u) => (u.worksDone || 0) >= 50 },
  { id: 'slots_jackpot', name: 'Jackpot!', emoji: '🎰', description: 'Gana un jackpot en slots', reward: 1000, condition: (u) => (u.slotsJackpots || 0) >= 1 },
  { id: 'first_pet', name: 'Dueño de Mascota', emoji: '🐾', description: 'Adopta tu primera mascota', reward: 200, condition: (u) => (u.petsOwned || 0) >= 1 },
  { id: 'allw_10', name: 'AllW Master', emoji: '⚡', description: 'Usa allw 10 veces', reward: 500, condition: (u) => (u.allwCount || 0) >= 10 },
  { id: 'give_5', name: 'Filántropo', emoji: '💝', description: 'Envía dinero 5 veces', reward: 300, condition: (u) => (u.givesDone || 0) >= 5 },
];

function getUserAchievements(userId) {
  if (!db.achievements.users[userId]) db.achievements.users[userId] = { unlocked: [] };
  return db.achievements.users[userId];
}

function checkAchievements(userId, userData) {
  const userAch = getUserAchievements(userId);
  const newUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (userAch.unlocked.includes(ach.id)) continue;
    try { if (ach.condition(userData)) { userAch.unlocked.push(ach.id); newUnlocked.push(ach); } } catch {}
  }
  if (newUnlocked.length > 0) save();
  return newUnlocked;
}

function getUserUnlocked(userId) { return getUserAchievements(userId).unlocked; }
function getAllAchievements() { return ACHIEVEMENTS; }
function getProgress(userId) {
  const u = getUserAchievements(userId);
  return { unlocked: u.unlocked.length, total: ACHIEVEMENTS.length, percent: Math.round((u.unlocked.length / ACHIEVEMENTS.length) * 100) };
}
function getTotalRewards(userId) {
  const u = getUserAchievements(userId);
  return u.unlocked.reduce((sum, id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return sum + (a ? a.reward : 0); }, 0);
}

// ═══════════════════════════════════════════════════════════════
//  RANKING / TEMPORADAS
// ═══════════════════════════════════════════════════════════════

const POSITION_REWARDS = [
  { pos: 1, reward: 10000, title: '👑 Rey del Server', emoji: '🥇' },
  { pos: 2, reward: 5000, title: '💎 Príncipe', emoji: '🥈' },
  { pos: 3, reward: 2500, title: '🏆 Noble', emoji: '🥉' },
  { pos: 4, reward: 1000, title: '⭐ Caballero', emoji: '4️⃣' },
  { pos: 5, reward: 500, title: '🌟 Escudero', emoji: '5️⃣' },
];

function checkSeason() {
  if (Date.now() >= db.ranking.seasonEnd) {
    db.ranking.season++;
    db.ranking.seasonStart = Date.now();
    db.ranking.seasonEnd = Date.now() + 7 * 24 * 60 * 60 * 1000;
    db.ranking.rewardsClaimed = false;
    scheduleSave();
    return true;
  }
  return false;
}

function getUserPosition(userId) {
  const all = getLevelLeaderboard(999);
  const pos = all.findIndex((u) => u.userId === userId);
  return pos === -1 ? null : pos + 1;
}

function getPositionReward(position) { return POSITION_REWARDS.find((r) => r.pos === position) || null; }

function claimSeasonReward(userId) {
  if (db.ranking.rewardsClaimed) return { success: false, error: 'Ya reclamaste las recompensas de esta tempada' };
  const pos = getUserPosition(userId);
  if (!pos || pos > 5) return { success: false, error: 'No estás en el top 5' };
  const reward = getPositionReward(pos);
  db.ranking.rewardsClaimed = true;
  const user = db.economy.users[userId] || {};
  db.ranking.history.unshift({ season: db.ranking.season, winner: userId, level: user.level || 1, date: Date.now() });
  if (db.ranking.history.length > 10) db.ranking.history = db.ranking.history.slice(0, 10);
  scheduleSave();
  return { success: true, position: pos, reward };
}

function getSeasonInfo() {
  return { season: db.ranking.season, seasonEnd: db.ranking.seasonEnd, timeLeft: Math.max(0, db.ranking.seasonEnd - Date.now()), rewardsClaimed: db.ranking.rewardsClaimed, history: db.ranking.history };
}

function getTopRewards() { return POSITION_REWARDS; }

// ═══════════════════════════════════════════════════════════════
//  GROUPS CONFIG
// ═══════════════════════════════════════════════════════════════

function getGroupConfig(groupId) {
  if (!db.groups[groupId]) {
    db.groups[groupId] = {
      welcome: true,
      goodbye: true,
      antilink: false,
      welcomeMsg: '',
      goodbyeMsg: '',
      mute: false,
    };
  }
  return db.groups[groupId];
}

function setGroupConfig(groupId, key, value) {
  const config = getGroupConfig(groupId);
  config[key] = value;
  scheduleSave();
  return config;
}

function toggleGroupSetting(groupId, key) {
  const config = getGroupConfig(groupId);
  config[key] = !config[key];
  scheduleSave();
  return { key, value: config[key] };
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  // Groups
  getGroupConfig, setGroupConfig, toggleGroupSetting,
  // Economy
  getUser, getBalance, addMoney, removeMoney, deposit, withdraw, giveMoney,
  checkCooldown, getCooldownRemaining, addXp, getLevelInfo, xpForLevel,
  getLeaderboard, getLevelLeaderboard, formatMoney, formatCooldown, getEconomyDb,
  // Events
  EVENT_TYPES, trySpawnEvent, getActiveEvent, claimEvent, getActiveEffect, forceEvent,
  getEventCatalog, getTimeUntilNextEvent,
  // Lottery
  TICKET_PRICE, DRAW_INTERVAL, buyTicket, drawLottery, getJackpot, getTimeUntilDraw,
  getUserTickets, getHistory, getTotalTickets,
  // Pets
  PET_CATALOG, FOOD_TYPES, getPetCatalog, getFoodCatalog, getPetFood,
  getUserPets, adoptPet, feedPet, battlePets, collectIncome, getPets, getPet,
  // Shop
  SHOP_CATALOG, VIP_LEVELS, getCatalog, getItem, getInventory, buyItem, useItem,
  hasBuff, isVip, getVipLevel, getVipInfo, getTitle, formatInventory,
  getXpMultiplier, getMoneyMultiplier, getVipLevels,
  // Properties
  PROPERTIES, getPropsCatalog, getProperty, getUserProps, buyProperty, sellProperty,
  collectRent, getProperties, getTotalRentPerHour,
  // Achievements
  ACHIEVEMENTS, getUserAchievements, checkAchievements, getUserUnlocked,
  getAllAchievements, getProgress, getTotalRewards,
  // Ranking
  POSITION_REWARDS, getUserPosition, getPositionReward, claimSeasonReward,
  getSeasonInfo, getTopRewards, checkSeason,
};
