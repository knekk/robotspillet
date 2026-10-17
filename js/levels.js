// Level definitions. Levels are pure data – add a new object here and it shows
// up in the game automatically.
//
// Coordinates: x = column (0 = left), y = row (0 = top).
// Directions:  0 = up (nord), 1 = right (øst), 2 = down (sør), 3 = left (vest).
//
// Level fields:
//   id         unique string
//   name       shown in the level list and game header
//   hint       short Norwegian tip shown under the board
//   cols/rows  grid size
//   start      { x, y, dir }
//   goal       { x, y }
//   walls      array of [x, y]
//   blocks     block types available in the palette
//   maxBlocks  optional – program may not use more blocks than this
//   best       fewest blocks needed – used for the 3-star message

export const DIRS = [
  { dx: 0, dy: -1 }, // 0 up
  { dx: 1, dy: 0 },  // 1 right
  { dx: 0, dy: 1 },  // 2 down
  { dx: -1, dy: 0 }, // 3 left
];

export const REPEAT_CHOICES = [2, 3, 4, 5, 6];

const BASIC = ['forward', 'left', 'right'];
const WITH_REPEAT = ['forward', 'left', 'right', 'repeat'];

/** Build a diagonal staircase corridor of walls for a square grid. */
function staircaseWalls(size) {
  const walls = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = x - (size - 1 - y);
      if (d > 1 || d < -1) walls.push([x, y]);
    }
  }
  return walls;
}

const worldEasy = {
  id: 'easy',
  nameKey: 'worldEasy',
  descKey: 'worldEasyDesc',
  emoji: '🌱',
  levels: [
    {
      id: 'e1',
      name: 'To skritt',
      hint: 'Roboten må gå fram to ganger. Trykk på «Gå fram» to ganger, og så Kjør!',
      cols: 5, rows: 3,
      start: { x: 0, y: 1, dir: 1 },
      goal: { x: 2, y: 1 },
      walls: [],
      blocks: BASIC,
      best: 2,
    },
    {
      id: 'e2',
      name: 'Fire skritt',
      hint: 'Tell rutene fram til flagget. Hvor mange ganger må roboten gå fram?',
      cols: 5, rows: 3,
      start: { x: 0, y: 1, dir: 1 },
      goal: { x: 4, y: 1 },
      walls: [],
      blocks: BASIC,
      best: 4,
    },
    {
      id: 'e3',
      name: 'Rundt hjørnet',
      hint: 'Roboten ser oppover. Den må gå fram, snu til høyre, og gå fram igjen.',
      cols: 4, rows: 4,
      start: { x: 0, y: 2, dir: 0 },
      goal: { x: 1, y: 1 },
      walls: [],
      blocks: BASIC,
      best: 3,
    },
    {
      id: 'e4',
      name: 'To svinger',
      hint: 'Et program er en liste med kommandoer. Roboten gjør dem i rekkefølge, én om gangen.',
      cols: 4, rows: 4,
      start: { x: 0, y: 2, dir: 0 },
      goal: { x: 2, y: 3 },
      walls: [],
      blocks: BASIC,
      best: 5,
    },
    {
      id: 'e5',
      name: 'Veggen',
      hint: 'Oi, en vegg! Når noe går galt kaller vi det en «bug». Finn en annen vei rundt.',
      cols: 4, rows: 2,
      start: { x: 0, y: 1, dir: 1 },
      goal: { x: 2, y: 0 },
      walls: [[1, 1]],
      blocks: BASIC,
      best: 5,
    },
  ],
};

const worldHard = {
  id: 'hard',
  nameKey: 'worldHard',
  descKey: 'worldHardDesc',
  emoji: '🚀',
  levels: [
    {
      id: 'h1',
      name: 'Gjenta!',
      hint: 'Du får bare bruke 2 klosser. «Gjenta» er en løkke – den gjør det samme flere ganger.',
      cols: 6, rows: 3,
      start: { x: 0, y: 1, dir: 1 },
      goal: { x: 4, y: 1 },
      walls: [],
      blocks: WITH_REPEAT,
      maxBlocks: 2,
      best: 2,
    },
    {
      id: 'h2',
      name: 'Den lange veien',
      hint: 'Seks fram, snu, tre fram. Med to løkker trenger du bare 5 klosser.',
      cols: 7, rows: 4,
      start: { x: 0, y: 3, dir: 1 },
      goal: { x: 6, y: 0 },
      walls: [],
      blocks: WITH_REPEAT,
      maxBlocks: 5,
      best: 5,
    },
    {
      id: 'h3',
      name: 'Trappa',
      hint: 'Fram, høyre, fram, venstre – og så det samme igjen. Hva kan du gjenta?',
      cols: 5, rows: 5,
      start: { x: 0, y: 4, dir: 0 },
      goal: { x: 4, y: 0 },
      walls: staircaseWalls(5),
      blocks: WITH_REPEAT,
      maxBlocks: 5,
      best: 5,
    },
    {
      id: 'h4',
      name: 'Rundt kvartalet',
      hint: 'Fram tre, snu høyre – fire ganger på rad. Kan du putte en løkke inni en annen løkke?',
      cols: 4, rows: 5,
      start: { x: 0, y: 4, dir: 0 },
      goal: { x: 2, y: 4 },
      walls: [
        [1, 2], [2, 2],
        [1, 3], [2, 3],
        [1, 4],
      ],
      blocks: WITH_REPEAT,
      maxBlocks: 6,
      best: 4,
    },
    {
      id: 'h5',
      name: 'Den store trappa',
      hint: 'Samme trapp som før, bare større. Du trenger ikke flere klosser – bare et større tall!',
      cols: 7, rows: 7,
      start: { x: 0, y: 6, dir: 0 },
      goal: { x: 6, y: 0 },
      walls: staircaseWalls(7),
      blocks: WITH_REPEAT,
      maxBlocks: 5,
      best: 5,
    },
  ],
};

export const worlds = [worldEasy, worldHard];

/** Flat list of all levels in play order. */
export const allLevels = worlds.flatMap((w) => w.levels);

export function findLevel(id) {
  return allLevels.find((l) => l.id === id) || null;
}

export function nextLevel(id) {
  const i = allLevels.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < allLevels.length ? allLevels[i + 1] : null;
}
