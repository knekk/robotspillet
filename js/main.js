// Entry point – apply translations and boot the game.

import { applyToDom } from './i18n.js';
import { Game } from './game.js';

applyToDom();
const game = new Game();
game.start();

// Handy for poking around in the browser console.
window.robotspillet = game;
