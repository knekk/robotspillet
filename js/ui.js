// All DOM rendering for palette, program strip, level list and modals.
// ui.js knows nothing about game rules – it only draws state and reports taps.

import { t, blockLabel } from './i18n.js';
import { REPEAT_CHOICES } from './levels.js';
import { countBlocks } from './interpreter.js';

export const BLOCK_ICONS = {
  forward: '⬆️',
  left: '↪️',
  right: '↩️',
  repeat: '🔁',
};

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export function showScreen(name) {
  for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden');
  $(`screen-${name}`).classList.remove('hidden');
}

/* ------------------------------------------------------------------ */
/* Start screen                                                        */
/* ------------------------------------------------------------------ */

export function renderPlayers(players, onPick, onRemove) {
  const list = $('player-list');
  list.innerHTML = '';
  for (const name of players) {
    const row = document.createElement('div');
    row.className = 'player-row';

    const btn = document.createElement('button');
    btn.className = 'btn btn-player';
    btn.textContent = `🙂 ${name}`;
    btn.addEventListener('click', () => onPick(name));

    const del = document.createElement('button');
    del.className = 'btn btn-icon btn-small';
    del.title = 'Slett';
    del.textContent = '🗑️';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Slette ${name}?`)) onRemove(name);
    });

    row.append(btn, del);
    list.appendChild(row);
  }
}

/* ------------------------------------------------------------------ */
/* Level select                                                        */
/* ------------------------------------------------------------------ */

export function renderWorlds(worlds, done, onPick) {
  const wrap = $('world-list');
  wrap.innerHTML = '';
  let previousDone = true; // first level is always unlocked

  for (const world of worlds) {
    const card = document.createElement('section');
    card.className = 'world-card';
    card.innerHTML = `
      <h3>${world.emoji} ${t(world.nameKey)}</h3>
      <p class="world-desc">${t(world.descKey)}</p>
      <div class="level-grid"></div>`;
    const grid = card.querySelector('.level-grid');

    world.levels.forEach((lvl, i) => {
      const isDone = done[lvl.id] !== undefined;
      const unlocked = previousDone || isDone;
      const btn = document.createElement('button');
      btn.className = 'btn btn-level' + (isDone ? ' done' : '') + (unlocked ? '' : ' locked');
      btn.disabled = !unlocked;
      const stars = isDone ? (done[lvl.id] <= lvl.best ? '⭐⭐⭐' : '⭐⭐') : '';
      btn.innerHTML = `<span class="level-num">${i + 1}</span><span class="level-name">${lvl.name}</span><span class="level-stars">${unlocked ? stars : '🔒'}</span>`;
      btn.addEventListener('click', () => onPick(lvl));
      grid.appendChild(btn);
      previousDone = isDone;
    });

    wrap.appendChild(card);
  }
}

/* ------------------------------------------------------------------ */
/* Game screen                                                         */
/* ------------------------------------------------------------------ */

export function setLevelHeader(level, index) {
  $('level-title').textContent = `${index + 1}. ${level.name}`;
  $('hint').textContent = level.hint || '';
}

export function renderPalette(blockTypes, onTap) {
  const pal = $('palette');
  pal.innerHTML = '';
  for (const type of blockTypes) {
    const b = makeBlockEl(type);
    b.classList.add('palette-block');
    b.addEventListener('click', () => onTap(type));
    pal.appendChild(b);
  }
}

function makeBlockEl(type, count) {
  const el = document.createElement('button');
  el.className = `block block-${type}`;
  el.type = 'button';
  const label = type === 'repeat' && count ? `${blockLabel(type)} × ${count}` : blockLabel(type);
  el.innerHTML = `<span class="block-icon">${BLOCK_ICONS[type]}</span><span class="block-label">${label}</span>`;
  return el;
}

/**
 * Render the program strip.
 * @param {Array} program
 * @param {object} opts
 *   activeRepeatId  id of repeat block currently receiving new blocks (or null)
 *   onTapBlock(block)      remove block
 *   onTapRepeat(block)     toggle repeat as active container
 *   onCloseRepeat(block)   tap on "ferdig" end cap
 */
export function renderProgram(program, opts) {
  const root = $('program');
  root.innerHTML = '';
  if (program.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'program-empty';
    empty.textContent = '👆 ' + t('help1');
    root.appendChild(empty);
  } else {
    renderBlocks(program, root, opts);
  }
}

function renderBlocks(blocks, parent, opts) {
  for (const b of blocks) {
    if (b.type === 'repeat') {
      const wrap = document.createElement('div');
      wrap.className = 'repeat-wrap' + (opts.activeRepeatId === b.id ? ' active' : '');
      wrap.dataset.blockId = b.id;

      const head = makeBlockEl('repeat', b.count);
      head.classList.add('repeat-head');
      head.dataset.blockId = b.id;
      head.addEventListener('click', () => opts.onTapRepeat(b));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'repeat-remove';
      remove.title = 'Fjern';
      remove.textContent = '✖';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onTapBlock(b);
      });
      head.appendChild(remove);

      const body = document.createElement('div');
      body.className = 'repeat-body';
      if (b.body.length === 0) {
        const ph = document.createElement('div');
        ph.className = 'repeat-placeholder';
        ph.textContent = '…';
        body.appendChild(ph);
      } else {
        renderBlocks(b.body, body, opts);
      }

      const end = document.createElement('button');
      end.type = 'button';
      end.className = 'repeat-end';
      end.textContent = opts.activeRepeatId === b.id ? '✔ ' + blockLabel('repeatEnd') : '';
      end.addEventListener('click', () => opts.onCloseRepeat(b));

      wrap.append(head, body, end);
      parent.appendChild(wrap);
    } else {
      const el = makeBlockEl(b.type);
      el.classList.add('program-block');
      el.dataset.blockId = b.id;
      el.addEventListener('click', () => opts.onTapBlock(b));
      parent.appendChild(el);
    }
  }
}

export function updateBlockCount(program, maxBlocks) {
  const used = countBlocks(program);
  const el = $('block-count');
  el.textContent = t('blockCount')(used, maxBlocks);
  el.classList.toggle('over', !!maxBlocks && used > maxBlocks);
}

export function highlightBlock(blockId) {
  for (const el of document.querySelectorAll('#program .running')) el.classList.remove('running');
  if (blockId) {
    const el = document.querySelector(`#program [data-block-id="${blockId}"]`);
    el?.classList.add('running');
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }
}

export function setRunning(running) {
  $('btn-run').disabled = running;
  $('palette').classList.toggle('disabled', running);
  $('program').classList.toggle('disabled', running);
}

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

function openModal(id) {
  $(id).classList.remove('hidden');
}
function closeModal(id) {
  $(id).classList.add('hidden');
}

export function askRepeatCount() {
  return new Promise((resolve) => {
    const box = $('repeat-choices');
    box.innerHTML = '';
    const finish = (v) => {
      closeModal('modal-repeat');
      $('btn-repeat-cancel').onclick = null;
      resolve(v);
    };
    for (const n of REPEAT_CHOICES) {
      const b = document.createElement('button');
      b.className = 'btn btn-choice';
      b.textContent = n;
      b.addEventListener('click', () => finish(n));
      box.appendChild(b);
    }
    $('btn-repeat-cancel').onclick = () => finish(null);
    openModal('modal-repeat');
  });
}

/**
 * Show the win/fail dialog.
 * @returns {Promise<'retry'|'next'|'levels'>}
 */
export function showResult({ ok, title, text, emoji, hasNext }) {
  return new Promise((resolve) => {
    $('result-emoji').textContent = emoji;
    $('result-title').textContent = title;
    $('result-text').textContent = text;
    const retry = $('btn-result-retry');
    const next = $('btn-result-next');
    retry.textContent = ok ? t('toLevels') : t('retry');
    next.textContent = ok ? (hasNext ? t('next') : t('toLevels')) : t('toLevels');
    next.classList.toggle('hidden', !ok);
    const card = $('modal-result').querySelector('.modal-card');
    card.classList.toggle('win', ok);
    card.classList.toggle('fail', !ok);

    const done = (v) => {
      closeModal('modal-result');
      retry.onclick = null;
      next.onclick = null;
      resolve(v);
    };
    retry.onclick = () => done(ok ? 'levels' : 'retry');
    next.onclick = () => done(hasNext ? 'next' : 'levels');
    openModal('modal-result');
  });
}

export function bindHelp() {
  $('btn-help').addEventListener('click', () => openModal('modal-help'));
  $('btn-help-close').addEventListener('click', () => closeModal('modal-help'));
}

export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}
