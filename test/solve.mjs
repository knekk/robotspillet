// Runs a known solution for every level through the real interpreter.
// Usage:  node test/solve.mjs
// Fails (exit 1) if any level is unsolvable, over its block limit, or the
// solution uses more blocks than `best`.

import { allLevels } from '../js/levels.js';
import { run, countBlocks, STEP_MS } from '../js/interpreter.js';

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

console.log(failed ? `\n${failed} level(s) failed` : '\nAll levels OK');
process.exit(failed ? 1 : 0);
