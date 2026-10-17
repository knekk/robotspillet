// Draws the grid, walls, goal and robot into #board using plain DOM elements.
// The robot is a single absolutely-positioned element moved with CSS
// transforms so every step animates smoothly.

export class Renderer {
  /**
   * @param {HTMLElement} boardEl
   */
  constructor(boardEl) {
    this.boardEl = boardEl;
    this.level = null;
    this.robotEl = null;
    this.cellSize = 0;
    this._onResize = () => this._layout();
    window.addEventListener('resize', this._onResize);
  }

  /** Build the board for a level. */
  setLevel(level) {
    this.level = level;
    const b = this.boardEl;
    b.innerHTML = '';
    b.style.setProperty('--cols', level.cols);
    b.style.setProperty('--rows', level.rows);

    const wallSet = new Set(level.walls.map(([x, y]) => `${x},${y}`));

    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if ((x + y) % 2 === 1) cell.classList.add('cell-alt');
        if (wallSet.has(`${x},${y}`)) {
          cell.classList.add('cell-wall');
          cell.innerHTML = '<img src="assets/wall.svg" alt="">';
        }
        if (x === level.goal.x && y === level.goal.y) {
          cell.classList.add('cell-goal');
          cell.innerHTML = '<img src="assets/goal.svg" alt="" class="goal-img">';
        }
        b.appendChild(cell);
      }
    }

    this.robotEl = document.createElement('div');
    this.robotEl.className = 'robot';
    this.robotEl.innerHTML = '<img src="assets/robot.svg" alt="Robot">';
    b.appendChild(this.robotEl);

    this._layout();
    this.setRobot(level.start.x, level.start.y, level.start.dir, false);
  }

  /** Recompute cell size from the rendered board. */
  _layout() {
    if (!this.level) return;
    const rect = this.boardEl.getBoundingClientRect();
    this.cellSize = rect.width / this.level.cols;
    if (this._lastPose) {
      const { x, y, dir } = this._lastPose;
      this.setRobot(x, y, dir, false);
    }
  }

  /**
   * Place the robot. `dir` is a cumulative rotation count so that turning
   * right from "left" (3) to "up" (4) rotates +90° instead of spinning -270°.
   */
  setRobot(x, y, dir, animate = true) {
    this._lastPose = { x, y, dir };
    const el = this.robotEl;
    if (!el) return;
    el.style.transition = animate ? '' : 'none';
    const px = x * this.cellSize;
    const py = y * this.cellSize;
    el.style.transform = `translate(${px}px, ${py}px) rotate(${dir * 90}deg)`;
    if (!animate) {
      // force reflow so the next transition starts from this pose
      void el.offsetWidth;
      el.style.transition = '';
    }
  }

  /** Short shake when the robot hits something. */
  bump() {
    const el = this.robotEl;
    if (!el) return;
    el.classList.remove('robot-bump');
    void el.offsetWidth;
    el.classList.add('robot-bump');
  }

  /** Celebration pulse on goal. */
  celebrate() {
    const el = this.robotEl;
    if (!el) return;
    el.classList.add('robot-win');
    const goal = this.boardEl.querySelector('.cell-goal');
    goal?.classList.add('cell-goal-win');
  }

  /** Clear win/bump states (called on reset). */
  clearEffects() {
    this.robotEl?.classList.remove('robot-win', 'robot-bump');
    this.boardEl.querySelector('.cell-goal')?.classList.remove('cell-goal-win');
  }
}
