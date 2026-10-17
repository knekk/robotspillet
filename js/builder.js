// Level builder ("Lag brett"). Tap cells to place walls, start and goal.
// Produces a shareable code via levelcode.js so the level can be rebuilt later.

import { encodeLevel, decodeLevel, shortestPathBlocks, MIN_SIZE, MAX_SIZE, MAX_LIMIT } from './levelcode.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const DIR_ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];

export class Builder {
  /**
   * @param {object} hooks
   *   onPlay(level)   start playing the built level
   *   onBack()        return to level select
   */
  constructor(hooks) {
    this.hooks = hooks;
    this.tool = 'wall'; // 'wall' | 'start' | 'goal' | 'erase'
    this.reset(5, 4);
    this._bind();
  }

  reset(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.start = { x: 0, y: rows - 1, dir: 1 };
    this.goal = { x: cols - 1, y: 0 };
    this.walls = new Set();
    this.maxBlocks = 0;
  }

  /** Load an existing level (from a code) into the editor. */
  load(level) {
    this.cols = level.cols;
    this.rows = level.rows;
    this.start = { ...level.start };
    this.goal = { ...level.goal };
    this.walls = new Set(level.walls.map(([x, y]) => `${x},${y}`));
    this.maxBlocks = level.maxBlocks || 0;
    this.render();
  }

  toLevel() {
    const walls = [...this.walls].map((k) => k.split(',').map(Number));
    const wallSet = this.walls;
    const best = shortestPathBlocks(this.cols, this.rows, this.start, this.goal, wallSet);
    return {
      id: 'builder',
      name: t('builderLevelName'),
      hint: '',
      cols: this.cols,
      rows: this.rows,
      start: { ...this.start },
      goal: { ...this.goal },
      walls,
      blocks: ['forward', 'left', 'right', 'repeat'],
      maxBlocks: this.maxBlocks || undefined,
      best,
      custom: true,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  show() {
    this.render();
  }

  render() {
    const board = $('builder-board');
    board.innerHTML = '';
    board.style.setProperty('--cols', this.cols);
    board.style.setProperty('--rows', this.rows);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell builder-cell' + ((x + y) % 2 ? ' cell-alt' : '');
        const k = `${x},${y}`;
        if (this.walls.has(k)) {
          cell.classList.add('cell-wall');
          cell.innerHTML = '<img src="assets/wall.svg" alt="">';
        } else if (x === this.start.x && y === this.start.y) {
          cell.classList.add('cell-start');
          cell.innerHTML = `<img src="assets/robot.svg" alt="" style="transform:rotate(${this.start.dir * 90}deg)">`;
        } else if (x === this.goal.x && y === this.goal.y) {
          cell.classList.add('cell-goal');
          cell.innerHTML = '<img src="assets/goal.svg" alt="" class="goal-img">';
        }
        cell.addEventListener('click', () => this.tapCell(x, y));
        board.appendChild(cell);
      }
    }

    $('builder-size').textContent = `${this.cols} × ${this.rows}`;
    $('builder-dir').textContent = DIR_ARROWS[this.start.dir];
    $('builder-max').textContent = this.maxBlocks ? String(this.maxBlocks) : '∞';

    for (const b of document.querySelectorAll('#builder-tools .tool')) {
      b.classList.toggle('active', b.dataset.tool === this.tool);
    }

    this.updateStatus();
  }

  updateStatus() {
    const level = this.toLevel();
    const solvable = Number.isFinite(level.best);
    const codeEl = $('builder-code');
    const status = $('builder-status');
    const play = $('btn-builder-play');

    if (solvable) {
      codeEl.value = encodeLevel(level);
      const limitWarn = this.maxBlocks && this.maxBlocks < level.best ? ' ' + t('builderLimitTooLow')(level.best) : '';
      status.textContent = t('builderSolvable')(level.best) + limitWarn;
      status.className = 'builder-status ok';
      play.disabled = false;
    } else {
      codeEl.value = '';
      status.textContent = t('builderUnsolvable');
      status.className = 'builder-status bad';
      play.disabled = true;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Editing                                                           */
  /* ---------------------------------------------------------------- */

  tapCell(x, y) {
    const k = `${x},${y}`;
    const isStart = x === this.start.x && y === this.start.y;
    const isGoal = x === this.goal.x && y === this.goal.y;

    if (this.tool === 'wall') {
      if (isStart || isGoal) return;
      if (this.walls.has(k)) this.walls.delete(k);
      else this.walls.add(k);
    } else if (this.tool === 'erase') {
      this.walls.delete(k);
    } else if (this.tool === 'start') {
      if (isGoal) return;
      if (isStart) {
        this.start.dir = (this.start.dir + 1) % 4; // tap again to rotate
      } else {
        this.walls.delete(k);
        this.start.x = x;
        this.start.y = y;
      }
    } else if (this.tool === 'goal') {
      if (isStart) return;
      this.walls.delete(k);
      this.goal.x = x;
      this.goal.y = y;
    }
    this.render();
  }

  resize(dc, dr) {
    const cols = Math.min(MAX_SIZE, Math.max(MIN_SIZE, this.cols + dc));
    const rows = Math.min(MAX_SIZE, Math.max(MIN_SIZE, this.rows + dr));
    if (cols === this.cols && rows === this.rows) return;
    this.cols = cols;
    this.rows = rows;
    // Clamp everything into the new grid.
    this.start.x = Math.min(this.start.x, cols - 1);
    this.start.y = Math.min(this.start.y, rows - 1);
    this.goal.x = Math.min(this.goal.x, cols - 1);
    this.goal.y = Math.min(this.goal.y, rows - 1);
    if (this.start.x === this.goal.x && this.start.y === this.goal.y) {
      this.goal.x = this.goal.x === 0 ? 1 : this.goal.x - 1;
    }
    for (const k of [...this.walls]) {
      const [x, y] = k.split(',').map(Number);
      if (x >= cols || y >= rows) this.walls.delete(k);
    }
    this.walls.delete(`${this.start.x},${this.start.y}`);
    this.walls.delete(`${this.goal.x},${this.goal.y}`);
    this.render();
  }

  changeMax(delta) {
    this.maxBlocks = Math.min(MAX_LIMIT, Math.max(0, this.maxBlocks + delta));
    this.render();
  }

  clearWalls() {
    this.walls.clear();
    this.render();
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                            */
  /* ---------------------------------------------------------------- */

  _bind() {
    for (const b of document.querySelectorAll('#builder-tools .tool')) {
      b.addEventListener('click', () => {
        this.tool = b.dataset.tool;
        this.render();
      });
    }
    $('btn-cols-minus').addEventListener('click', () => this.resize(-1, 0));
    $('btn-cols-plus').addEventListener('click', () => this.resize(1, 0));
    $('btn-rows-minus').addEventListener('click', () => this.resize(0, -1));
    $('btn-rows-plus').addEventListener('click', () => this.resize(0, 1));
    $('btn-dir').addEventListener('click', () => {
      this.start.dir = (this.start.dir + 1) % 4;
      this.render();
    });
    $('btn-max-minus').addEventListener('click', () => this.changeMax(-1));
    $('btn-max-plus').addEventListener('click', () => this.changeMax(1));
    $('btn-builder-clear').addEventListener('click', () => this.clearWalls());
    $('btn-builder-back').addEventListener('click', () => this.hooks.onBack());
    $('btn-builder-play').addEventListener('click', () => {
      const level = this.toLevel();
      if (Number.isFinite(level.best)) {
        level.code = encodeLevel(level);
        level.id = `code:${level.code}`;
        this.hooks.onPlay(level);
      }
    });
    $('btn-builder-copy').addEventListener('click', async () => {
      const code = $('builder-code').value;
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        this.hooks.onToast(t('codeCopied'));
      } catch {
        $('builder-code').select();
      }
    });
    $('builder-load-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const { level, error } = decodeLevel($('builder-load-input').value);
      if (error) {
        this.hooks.onToast(t('codeInvalid'));
        return;
      }
      this.load(level);
      $('builder-load-input').value = '';
    });
  }
}
