// Runs a known solution for every level through the real interpreter.
// Usage:  node test/solve.mjs
// Fails (exit 1) if any level is unsolvable, over its block limit, or the
// solution uses more blocks than `best`.

import { allLevels } from '../js/levels.js';
import { run, countBlocks } from '../js/interpreter.js';
import { encodeLevel, decodeLevel, isSolvable, shortestPathBlocks } from '../js/levelcode.js';

// Make the interpreter run instantly.
globalThis.setTimeout = (fn) => fn();

let id = 0;
const F = () => ({ id: `t${id++}`, type: 'forward' });
const L = () => ({ id: `t${id++}`, type: 'left' });
const R = () => ({ id: `t${id++}`, type: 'right' });
const REP = (count, ...body) => ({ id: `t${id++}`, type: 'repeat', count, body });

const solutions = {
  e1: () => [F(), F()],
  e2: () => [F(), F(), F(), F()],
  e3: () => [F(), R(), F()],
  e4: () => [R(), F(), F(), R(), F()],
  e5: () => [L(), F(), R(), F(), F()],
  h1: () => [REP(4, F())],
  h2: () => [REP(6, F()), L(), REP(3, F())],
  h3: () => [REP(4, F(), R(), F(), L())],
  h4: () => [REP(4, REP(3, F()), R())],
  h5: () => [REP(6, F(), R(), F(), L())],
};

let failed = 0;

for (const lvl of allLevels) {
  const make = solutions[lvl.id];
  if (!make) {
    console.log(`✖ ${lvl.id} – no test solution`);
    failed++;
    continue;
  }
  const program = make();
  const used = countBlocks(program);
  const res = await run(lvl, program, {});
  const problems = [];
  if (!res.ok) problems.push(`not solved (${res.reason})`);
  if (lvl.maxBlocks && used > lvl.maxBlocks) problems.push(`uses ${used} > maxBlocks ${lvl.maxBlocks}`);
  if (used > lvl.best) problems.push(`uses ${used} > best ${lvl.best}`);
  if (problems.length) {
    console.log(`✖ ${lvl.id} ${lvl.name}: ${problems.join(', ')}`);
    failed++;
  } else {
    console.log(`✔ ${lvl.id} ${lvl.name} – ${used} blocks, ${res.steps} steps`);
  }
}

// ---- Level code round-trip -------------------------------------------------

console.log('\nLevel codes:');
for (const lvl of allLevels) {
  const code = encodeLevel(lvl);
  const { level: back, error } = decodeLevel(code);
  const problems = [];
  if (error) problems.push(`decode error ${error}`);
  else {
    const same =
      back.cols === lvl.cols &&
      back.rows === lvl.rows &&
      back.start.x === lvl.start.x &&
      back.start.y === lvl.start.y &&
      back.start.dir === lvl.start.dir &&
      back.goal.x === lvl.goal.x &&
      back.goal.y === lvl.goal.y &&
      (back.maxBlocks || 0) === (lvl.maxBlocks || 0) &&
      JSON.stringify([...back.walls].sort()) === JSON.stringify([...lvl.walls].sort());
    if (!same) problems.push('round-trip mismatch');
    if (!isSolvable(back)) problems.push('decoded level unsolvable');
    // Lowercase / spaced input must also decode.
    if (decodeLevel(' ' + code.toLowerCase() + ' ').error) problems.push('normalisation failed');
  }
  if (problems.length) {
    console.log(`✖ ${lvl.id} ${code}: ${problems.join(', ')}`);
    failed++;
  } else {
    console.log(`✔ ${lvl.id} ${code}`);
  }
}

// Invalid codes must be rejected, not crash.
for (const bad of ['', 'R1', 'R1-53011410', 'R1-53011410-!!!', 'R1-00011410-AAA', 'R1-53000000-AAA', 'R2-53011410-AAA']) {
  const { error } = decodeLevel(bad);
  if (!error) {
    console.log(`✖ accepted invalid code "${bad}"`);
    failed++;
  }
}

// BFS sanity: walled-off goal is unreachable.
const blocked = shortestPathBlocks(3, 3, { x: 0, y: 0, dir: 1 }, { x: 2, y: 2 }, new Set(['1,0', '1,1', '1,2']));
if (Number.isFinite(blocked)) {
  console.log('✖ BFS found a path through a solid wall');
  failed++;
} else {
  console.log('✔ BFS rejects walled-off goal');
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks OK');
process.exit(failed ? 1 : 0);
