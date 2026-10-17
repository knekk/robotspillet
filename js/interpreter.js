// Turns a block program into a flat list of steps and runs them one at a
// time with a delay, so the child can watch each command happen.
//
// Program format (nested):
//   { id, type: 'forward' | 'left' | 'right' }
//   { id, type: 'repeat', count: 3, body: [ ...blocks ] }
//
// Each step emitted: { blockId, type }

import { DIRS } from './levels.js';

export const STEP_MS = 650;

/** Count blocks the way the block limit sees them (repeat counts as one). */
export function countBlocks(program) {
  let n = 0;
  for (const b of program) {
    n += 1;
    if (b.type === 'repeat') n += countBlocks(b.body);
  }
  return n;
}

/** Flatten nested repeats into a linear step list. */
export function flatten(program, out = [], depth = 0) {
  if (depth > 20) return out; // safety against absurd nesting
  for (const b of program) {
    if (b.type === 'repeat') {
      for (let i = 0; i < b.count; i++) flatten(b.body, out, depth + 1);
    } else {
      out.push({ blockId: b.id, type: b.type });
    }
  }
  return out;
}

/**
 * Run a program against a level.
 *
 * @param {object} level
 * @param {Array}  program
 * @param {object} hooks
 *   onStep(step, pose)      called before each step is applied
 *   onMove(pose, animate)   robot moved / turned
 *   onBump(pose)            robot tried to move into wall or off grid
 *   isCancelled()           return true to abort
 * @returns {Promise<{ ok: boolean, reason?: 'wall'|'edge'|'notThere', steps: number }>}
 */
export async function run(level, program, hooks) {
  const steps = flatten(program);
  const wallSet = new Set(level.walls.map(([x, y]) => `${x},${y}`));

  // `heading` is 0-3, `spin` is cumulative so the renderer rotates the short way.
  let x = level.start.x;
  let y = level.start.y;
  let heading = level.start.dir;
  let spin = level.start.dir;

  const pose = () => ({ x, y, dir: spin, heading });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < steps.length; i++) {
    if (hooks.isCancelled?.()) return { ok: false, reason: 'cancelled', steps: i };
    const step = steps[i];
    hooks.onStep?.(step, pose());

    if (step.type === 'left') {
      heading = (heading + 3) % 4;
      spin -= 1;
      hooks.onMove?.(pose(), true);
    } else if (step.type === 'right') {
      heading = (heading + 1) % 4;
      spin += 1;
      hooks.onMove?.(pose(), true);
    } else if (step.type === 'forward') {
      const nx = x + DIRS[heading].dx;
      const ny = y + DIRS[heading].dy;
      const offGrid = nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows;
      if (offGrid) {
        hooks.onBump?.(pose());
        await sleep(STEP_MS);
        return { ok: false, reason: 'edge', steps: i + 1 };
      }
      if (wallSet.has(`${nx},${ny}`)) {
        hooks.onBump?.(pose());
        await sleep(STEP_MS);
        return { ok: false, reason: 'wall', steps: i + 1 };
      }
      x = nx;
      y = ny;
      hooks.onMove?.(pose(), true);
    }

    await sleep(STEP_MS);

    if (x === level.goal.x && y === level.goal.y) {
      return { ok: true, steps: i + 1 };
    }
  }

  const reached = x === level.goal.x && y === level.goal.y;
  return reached ? { ok: true, steps: steps.length } : { ok: false, reason: 'notThere', steps: steps.length };
}
