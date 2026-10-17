// Game state and flow: players → level select → play → result.
// Wires ui.js (drawing), interpreter.js (rules), renderer.js (board) and storage.js.

import { worlds, allLevels, nextLevel } from './levels.js';
import { Renderer } from './renderer.js';
import * as interp from './interpreter.js';
import * as ui from './ui.js';
import * as store from './storage.js';
import { t, tRandom } from './i18n.js';

const $ = (id) => document.getElementById(id);

let nextBlockId = 1;
const newId = () => `b${nextBlockId++}`;

export class Game {
  constructor() {
    this.player = null;
    this.level = null;
    this.program = [];
    this.activeRepeat = null; // repeat block currently receiving taps
    this.running = false;
    this.cancelled = false;
    this.renderer = new Renderer($('board'));
    this._bind();
  }

  /* ---------------------------------------------------------------- */
  /* Boot and navigation                                               */
  /* ---------------------------------------------------------------- */

  start() {
    const last = store.getLastPlayer();
    if (last && store.listPlayers().includes(last)) {
      this.pickPlayer(last);
    } else {
      this.showStart();
    }
  }

  showStart() {
    ui.renderPlayers(
      store.listPlayers(),
      (name) => this.pickPlayer(name),
      (name) => {
        store.removePlayer(name);
        this.showStart();
      },
    );
    $('new-player-name').value = '';
    ui.showScreen('start');
  }

  pickPlayer(name) {
    store.ensurePlayer(name);
    this.player = name;
    $('current-player-name').textContent = name;
    this.showLevels();
  }

  showLevels() {
    ui.renderWorlds(worlds, store.getDone(this.player), (lvl) => this.loadLevel(lvl));
    ui.showScreen('levels');
  }

  loadLevel(level) {
    this.level = level;
    this.program = [];
    this.activeRepeat = null;
    this.cancelled = true; // stop any run in progress
    this.running = false;
    this.renderer.setLevel(level);
    ui.setLevelHeader(level, allLevels.indexOf(level));
    ui.renderPalette(level.blocks, (type) => this.addBlock(type));
    ui.setRunning(false);
    this.refreshProgram();
    ui.showScreen('game');
    // Board size depends on layout; re-measure after the screen is visible.
    requestAnimationFrame(() => this.renderer._layout());
  }

  /* ---------------------------------------------------------------- */
  /* Program editing                                                   */
  /* ---------------------------------------------------------------- */

  async addBlock(type) {
    if (this.running) return;
    const max = this.level.maxBlocks;
    if (max && interp.countBlocks(this.program) >= max) {
      ui.toast(t('tooManyBlocks')(max));
      return;
    }

    let block;
    if (type === 'repeat') {
      const count = await ui.askRepeatCount();
      if (!count) return;
      block = { id: newId(), type, count, body: [] };
    } else {
      block = { id: newId(), type };
    }

    const target = this.activeRepeat ? this.activeRepeat.body : this.program;
    target.push(block);
    if (block.type === 'repeat') this.activeRepeat = block; // start filling the loop
    this.refreshProgram();
  }

  removeBlock(block) {
    if (this.running) return;
    const remove = (list) => {
      const i = list.indexOf(block);
      if (i >= 0) {
        list.splice(i, 1);
        return true;
      }
      return list.some((b) => b.type === 'repeat' && remove(b.body));
    };
    remove(this.program);
    if (this.activeRepeat === block || !this.contains(this.program, this.activeRepeat)) {
      this.activeRepeat = null;
    }
    this.refreshProgram();
  }

  contains(list, block) {
    if (!block) return false;
    return list.some((b) => b === block || (b.type === 'repeat' && this.contains(b.body, block)));
  }

  toggleRepeat(block) {
    if (this.running) return;
    this.activeRepeat = this.activeRepeat === block ? null : block;
    this.refreshProgram();
  }

  closeRepeat() {
    if (this.running) return;
    this.activeRepeat = null;
    this.refreshProgram();
  }

  resetProgram() {
    this.cancelled = true;
    this.running = false;
    this.program = [];
    this.activeRepeat = null;
    this.renderer.clearEffects();
    this.renderer.setRobot(this.level.start.x, this.level.start.y, this.level.start.dir, false);
    ui.setRunning(false);
    ui.highlightBlock(null);
    this.refreshProgram();
  }

  refreshProgram() {
    ui.renderProgram(this.program, {
      activeRepeatId: this.activeRepeat?.id ?? null,
      onTapBlock: (b) => this.removeBlock(b),
      onTapRepeat: (b) => this.toggleRepeat(b),
      onCloseRepeat: () => this.closeRepeat(),
    });
    ui.updateBlockCount(this.program, this.level.maxBlocks);
  }

  /* ---------------------------------------------------------------- */
  /* Running                                                           */
  /* ---------------------------------------------------------------- */

  async run() {
    if (this.running) return;
    if (this.program.length === 0) {
      ui.toast(t('emptyProgram'));
      return;
    }
    const max = this.level.maxBlocks;
    const used = interp.countBlocks(this.program);
    if (max && used > max) {
      ui.toast(t('tooManyBlocks')(max));
      return;
    }

    this.activeRepeat = null;
    this.refreshProgram();
    this.running = true;
    this.cancelled = false;
    this.renderer.clearEffects();
    this.renderer.setRobot(this.level.start.x, this.level.start.y, this.level.start.dir, false);
    ui.setRunning(true);

    const result = await interp.run(this.level, this.program, {
      onStep: (step) => ui.highlightBlock(step.blockId),
      onMove: (pose) => this.renderer.setRobot(pose.x, pose.y, pose.dir, true),
      onBump: () => this.renderer.bump(),
      isCancelled: () => this.cancelled,
    });

    if (this.cancelled) return; // user left the level or reset

    this.running = false;
    ui.setRunning(false);
    ui.highlightBlock(null);

    if (result.ok) {
      this.renderer.celebrate();
      store.markDone(this.player, this.level.id, used);
      const next = nextLevel(this.level.id);
      const choice = await ui.showResult({
        ok: true,
        emoji: '🎉',
        title: t('winTitle'),
        text: `${tRandom('winText')} ${t('winStars')(used, this.level.best)}`,
        hasNext: !!next,
      });
      if (choice === 'next' && next) this.loadLevel(next);
      else this.showLevels();
    } else {
      const textKey = { wall: 'failWall', edge: 'failEdge', notThere: 'failNotThere' }[result.reason] || 'failNotThere';
      const choice = await ui.showResult({
        ok: false,
        emoji: result.reason === 'notThere' ? '🤔' : '💥',
        title: t('failTitle'),
        text: t(textKey),
        hasNext: false,
      });
      if (choice === 'levels') this.showLevels();
      else {
        // keep the program so the child can fix it – that is the lesson
        this.renderer.clearEffects();
        this.renderer.setRobot(this.level.start.x, this.level.start.y, this.level.start.dir, false);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Event wiring                                                      */
  /* ---------------------------------------------------------------- */

  _bind() {
    $('new-player-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('new-player-name').value.trim();
      if (name) this.pickPlayer(name);
    });
    $('btn-change-player').addEventListener('click', () => this.showStart());
    $('btn-back').addEventListener('click', () => {
      this.cancelled = true;
      this.running = false;
      this.showLevels();
    });
    $('btn-run').addEventListener('click', () => this.run());
    $('btn-reset').addEventListener('click', () => this.resetProgram());
    ui.bindHelp();
  }
}
