// Encode a level as a short shareable code, and decode it back.
// Lets kids rebuild a level in a later session without any server.
//
// Format (version 1):
//   R1-<cols><rows><sx><sy><dir><gx><gy><max>-<wallbits>
//   Each dimension/coordinate is one base-36 digit (grids up to 9x9).
//   <max> is 0 for "no limit".
//   <wallbits> is the cells (row-major) as a bit string, packed 5 bits per
//   base-32 character, so a 5x5 board is 5 characters.
//
// Example: a 5x3 board, start (0,1) facing right, goal (4,1), no walls:
//   R1-53011410-000

const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 → fewer typos
const B32_INDEX = Object.fromEntries([...B32].map((c, i) => [c, i]));

const PREFIX = 'R1';
export const MIN_SIZE = 2;
export const MAX_SIZE = 9;
// Keep the max-blocks digit below 'I' (18) so normaliseCode's I→1 / O→0
// typo fixes can never corrupt a valid header.
export const MAX_LIMIT = 15;

function b36(n) {
  return n.toString(36);
}

export function encodeLevel(level) {
  const { cols, rows, start, goal, walls, maxBlocks = 0 } = level;
  const header =
    b36(cols) + b36(rows) + b36(start.x) + b36(start.y) + b36(start.dir) + b36(goal.x) + b36(goal.y) + b36(Math.min(maxBlocks, MAX_LIMIT));

  const wallSet = new Set(walls.map(([x, y]) => `${x},${y}`));
  let bits = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) bits += wallSet.has(`${x},${y}`) ? '1' : '0';
  }
  while (bits.length % 5) bits += '0';

  let packed = '';
  for (let i = 0; i < bits.length; i += 5) packed += B32[parseInt(bits.slice(i, i + 5), 2)];

  return `${PREFIX}-${header}-${packed}`;
}

/** Normalise user input: uppercase, strip spaces, map easily-confused chars. */
export function normaliseCode(input) {
  return String(input)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/O/g, '0') // only valid inside header digits; wall part never has O
    .replace(/I/g, '1');
}

/**
 * Decode a code into a level object.
 * @returns {{ level?: object, error?: string }}
 */
export function decodeLevel(input) {
  const code = normaliseCode(input);
  const m = /^R1-([0-9A-Z]{8})-([A-Z2-9]+)$/.exec(code);
  if (!m) return { error: 'format' };

  const h = m[1].toLowerCase();
  const n = (i) => parseInt(h[i], 36);
  const cols = n(0);
  const rows = n(1);
  const start = { x: n(2), y: n(3), dir: n(4) };
  const goal = { x: n(5), y: n(6) };
  const maxBlocks = n(7);

  if (![cols, rows, start.x, start.y, start.dir, goal.x, goal.y, maxBlocks].every(Number.isFinite)) return { error: 'format' };
  if (cols < MIN_SIZE || cols > MAX_SIZE || rows < MIN_SIZE || rows > MAX_SIZE) return { error: 'size' };
  if (start.dir > 3) return { error: 'format' };
  if (start.x >= cols || start.y >= rows || goal.x >= cols || goal.y >= rows) return { error: 'bounds' };
  if (start.x === goal.x && start.y === goal.y) return { error: 'same' };

  let bits = '';
  for (const ch of m[2]) {
    const v = B32_INDEX[ch];
    if (v === undefined) return { error: 'format' };
    bits += v.toString(2).padStart(5, '0');
  }
  if (bits.length < cols * rows) return { error: 'format' };

  const walls = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (bits[y * cols + x] === '1') walls.push([x, y]);
    }
  }
  const wallSet = new Set(walls.map(([x, y]) => `${x},${y}`));
  if (wallSet.has(`${start.x},${start.y}`) || wallSet.has(`${goal.x},${goal.y}`)) return { error: 'bounds' };

  const level = {
    id: `code:${code}`,
    name: 'Eget brett',
    hint: '',
    cols,
    rows,
    start,
    goal,
    walls,
    blocks: ['forward', 'left', 'right', 'repeat'],
    maxBlocks: maxBlocks || undefined,
    best: shortestPathBlocks(cols, rows, start, goal, wallSet),
    custom: true,
    code,
  };
  return { level };
}

/**
 * BFS over (x, y, heading) counting commands; returns the minimum number
 * of forward/turn commands needed, or Infinity if the goal is unreachable.
 */
export function shortestPathBlocks(cols, rows, start, goal, wallSet) {
  const DIRS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const key = (x, y, d) => (y * cols + x) * 4 + d;
  const dist = new Map([[key(start.x, start.y, start.dir), 0]]);
  const queue = [[start.x, start.y, start.dir]];
  while (queue.length) {
    const [x, y, d] = queue.shift();
    const cur = dist.get(key(x, y, d));
    if (x === goal.x && y === goal.y) return cur;
    const next = [
      [x, y, (d + 1) % 4],
      [x, y, (d + 3) % 4],
    ];
    const nx = x + DIRS[d][0];
    const ny = y + DIRS[d][1];
    if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !wallSet.has(`${nx},${ny}`)) next.push([nx, ny, d]);
    for (const [ax, ay, ad] of next) {
      const k = key(ax, ay, ad);
      if (!dist.has(k)) {
        dist.set(k, cur + 1);
        queue.push([ax, ay, ad]);
      }
    }
  }
  return Infinity;
}

/** True if the robot can reach the goal at all. */
export function isSolvable(level) {
  const wallSet = new Set(level.walls.map(([x, y]) => `${x},${y}`));
  return Number.isFinite(shortestPathBlocks(level.cols, level.rows, level.start, level.goal, wallSet));
}
