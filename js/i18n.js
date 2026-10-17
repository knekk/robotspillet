// Norwegian bokmål string table. Keep every user-facing string here so the
// game can be translated later by adding another language object.

const nb = {
  // General
  title: 'Robotspillet',
  whoPlays: 'Hvem skal spille?',
  yourName: 'Navnet ditt',
  start: 'Start',
  chooseLevel: 'Velg brett',
  yourProgram: 'Programmet ditt',
  blocks: 'Klosser',
  run: 'Kjør',
  reset: 'Nullstill',
  cancel: 'Avbryt',
  ok: 'OK',
  back: 'Tilbake',
  next: 'Neste brett',
  retry: 'Prøv igjen',
  toLevels: 'Til brettene',
  howManyTimes: 'Hvor mange ganger?',
  blockCount: (used, max) => (max ? `${used} av ${max} klosser` : `${used} klosser`),
  tooManyBlocks: (max) => `Du kan bare bruke ${max} klosser på dette brettet. Prøv Gjenta!`,
  emptyProgram: 'Programmet er tomt. Legg til noen klosser først!',
  locked: 'Låst',

  // Worlds
  worldEasy: 'Verden 1 – Lett',
  worldEasyDesc: 'Gå fram og snu. Perfekt for de minste.',
  worldHard: 'Verden 2 – Vanskelig',
  worldHardDesc: 'Bruk Gjenta for å gjøre programmet kortere.',

  // Builder / custom levels
  builderTitle: 'Lag brett',
  builderCardTitle: '🛠️ Lag ditt eget brett',
  builderCardDesc: 'Bygg et brett, få en kode, og spill det igjen senere.',
  builderOpen: 'Åpne bretbyggeren',
  builderLevelName: 'Eget brett',
  playCode: 'Spill en kode',
  playCodePlaceholder: 'R1-…',
  play: 'Spill',
  toolWall: 'Vegg',
  toolStart: 'Robot',
  toolGoal: 'Mål',
  toolErase: 'Visk ut',
  size: 'Størrelse',
  direction: 'Retning',
  blockLimit: 'Maks klosser',
  clearWalls: 'Fjern vegger',
  yourCode: 'Koden din',
  copy: 'Kopier',
  codeCopied: 'Koden er kopiert!',
  codeInvalid: 'Hmm, den koden kjente jeg ikke igjen. Sjekk at du skrev den riktig.',
  loadCode: 'Hent brett fra kode',
  load: 'Hent',
  builderHelp: 'Velg et verktøy og trykk på rutene. Trykk på roboten igjen for å snu den.',
  builderSolvable: (best) => `Roboten kan komme fram med ${best} klosser. ✔`,
  builderUnsolvable: 'Roboten kan ikke komme fram til målet! Fjern noen vegger.',
  builderLimitTooLow: (best) => `Obs: maks klosser er lavere enn ${best}, men med Gjenta kan det gå.`,
  builderEdit: 'Endre brett',

  // Blocks
  block: {
    forward: 'Gå fram',
    left: 'Snu venstre',
    right: 'Snu høyre',
    repeat: 'Gjenta',
    repeatEnd: 'ferdig',
  },

  // Results
  winTitle: 'Hurra! 🎉',
  winText: [
    'Roboten kom fram! Du er en ekte programmerer.',
    'Supert! Programmet ditt virket perfekt.',
    'Fantastisk! Roboten fulgte alle kommandoene dine.',
  ],
  winStars: (used, best) =>
    used <= best ? 'Du brukte så få klosser som mulig! ⭐⭐⭐' : `Du klarte det med ${used} klosser. Klarer du det med ${best}? ⭐⭐`,

  failTitle: 'Oi sann!',
  failWall: 'Roboten krasjet i en vegg. Hvor gikk det galt?',
  failEdge: 'Roboten gikk utenfor brettet. Prøv å telle rutene en gang til!',
  failNotThere: 'Programmet er ferdig, men roboten kom ikke helt fram. Mangler det noen klosser?',

  // Help
  helpTitle: 'Slik spiller du',
  help1: 'Trykk på en kloss for å legge den til i programmet.',
  help2: 'Trykk på en kloss i programmet for å fjerne den.',
  help3: 'Trykk Kjør, og se roboten følge programmet ditt!',
  help4: 'Kom roboten ikke fram? Prøv igjen – det er sånn programmerere jobber.',

  // Programming words explained (shown as level hints)
  conceptSequence: 'Et program er en liste med kommandoer. Roboten gjør dem i rekkefølge, én om gangen.',
  conceptDebug: 'Når noe går galt, kaller vi det en «bug». Å finne og fikse den heter «debugging».',
  conceptLoop: 'Gjenta kalles en «løkke». Den gjør samme ting mange ganger, så du slipper å skrive det om og om igjen.',
};

let current = nb;

/** Get a string (or function) from the active language. */
export function t(key) {
  return current[key] ?? key;
}

/** Get a block label. */
export function blockLabel(type) {
  return current.block[type] ?? type;
}

/** Pick a random entry from an array-valued string (e.g. win messages). */
export function tRandom(key) {
  const v = current[key];
  if (Array.isArray(v)) return v[Math.floor(Math.random() * v.length)];
  return v ?? key;
}

/** Replace text of all elements with data-i18n / data-i18n-placeholder attributes. */
export function applyToDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = current[el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const v = current[el.dataset.i18nPlaceholder];
    if (typeof v === 'string') el.placeholder = v;
  });
}
