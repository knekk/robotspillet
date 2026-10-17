// Persist players and their progress in localStorage.
// Shape: { players: { [name]: { done: { [levelId]: bestBlockCount } } }, lastPlayer: string|null }

const KEY = 'robotspillet.v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt data */
  }
  return { players: {}, lastPlayer: null };
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable in private mode – game still works */
  }
}

export function listPlayers() {
  return Object.keys(load().players);
}

export function getLastPlayer() {
  return load().lastPlayer;
}

export function ensurePlayer(name) {
  const data = load();
  if (!data.players[name]) data.players[name] = { done: {} };
  data.lastPlayer = name;
  save(data);
}

export function removePlayer(name) {
  const data = load();
  delete data.players[name];
  if (data.lastPlayer === name) data.lastPlayer = null;
  save(data);
}

/** Record a completed level, keeping the lowest block count. */
export function markDone(name, levelId, blocksUsed) {
  const data = load();
  const p = data.players[name] || (data.players[name] = { done: {} });
  const prev = p.done[levelId];
  if (prev === undefined || blocksUsed < prev) p.done[levelId] = blocksUsed;
  save(data);
}

export function getDone(name) {
  return load().players[name]?.done || {};
}
