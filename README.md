# 🤖 Robotspillet

Et nettleserspill som lærer barn hva programmering er. Du bygger et program av
klosser, trykker **Kjør**, og ser roboten følge kommandoene dine – én om gangen –
for å komme fram til flagget.

Spillet lærer bort tre grunnideer:

| Idé | I spillet |
|-----|-----------|
| **Sekvens** – et program er en liste med kommandoer som kjøres i rekkefølge | Verden 1 |
| **Debugging** – når roboten krasjer, finn feilen og prøv igjen | Verden 1, brett 5 |
| **Løkker** – «Gjenta» gjør det samme flere ganger med færre klosser | Verden 2 |

Laget for to søsken på 6 og 9 år: alle klosser har ikon *og* tekst, store trykkflater
for nettbrett, og to verdener med ulik vanskelighetsgrad.

## Spill det

**👉 Spill her: <https://knekk.github.io/robotspillet/>**

Eller åpne `index.html` lokalt (se «Kjøre lokalt» under).

Fungerer på nettbrett, mobil og PC. Ingen installasjon.

## Slik spiller du

1. Skriv inn navnet ditt (framgangen lagres i nettleseren).
2. Velg et brett. Nye brett låses opp etter hvert som du klarer dem.
3. Trykk på klosser for å legge dem til i programmet.
   - Trykk på en kloss i programmet for å fjerne den.
   - **Gjenta**: velg antall, så havner de neste klossene *inni* løkken.
     Trykk «✔ ferdig» eller på Gjenta-klossen igjen for å gå ut av løkken.
4. Trykk **Kjør** og se på!
5. Krasjet roboten? Det er helt vanlig. Finn feilen og prøv igjen.

## Teknisk

- Ren HTML, CSS og JavaScript (ES-moduler). Ingen byggeverktøy, ingen avhengigheter.
- Alt kjører i nettleseren. Framgang lagres i `localStorage`.

```
robotspillet/
├── index.html          # siden
├── css/style.css       # utseende
├── js/
│   ├── main.js         # oppstart
│   ├── game.js         # spillflyt og tilstand
│   ├── levels.js       # brettene (ren data)
│   ├── interpreter.js  # kjører programmet steg for steg
│   ├── renderer.js     # tegner brettet og roboten
│   ├── ui.js           # knapper, klosser, dialoger
│   ├── storage.js      # lagring av framgang
│   └── i18n.js         # alle norske tekster
└── assets/             # robot.svg, goal.svg, wall.svg
```

### Lage et nytt brett

Åpne `js/levels.js` og legg til et objekt i `levels`-lista til en verden:

```js
{
  id: 'e6',                       // unik id
  name: 'Mitt brett',
  hint: 'Et lite hint som vises under brettet.',
  cols: 5, rows: 4,               // størrelse
  start: { x: 0, y: 3, dir: 1 },  // dir: 0=opp 1=høyre 2=ned 3=venstre
  goal: { x: 4, y: 0 },
  walls: [[2, 1], [2, 2]],        // [x, y]
  blocks: ['forward', 'left', 'right', 'repeat'],
  maxBlocks: 6,                   // valgfritt – tvinger fram løkker
  best: 4,                        // færrest mulige klosser (gir tre stjerner)
}
```

Lagre, last siden på nytt – brettet er med.

### Kjøre lokalt

Fordi spillet bruker ES-moduler må det serveres over HTTP (ikke `file://`) i noen
nettlesere. Enkleste måte:

```
cd robotspillet
python -m http.server 8000
```

Åpne deretter <http://localhost:8000>. Alternativt: VS Code-utvidelsen «Live Server».

## Publisere på GitHub Pages

1. Opprett et offentlig repo kalt `robotspillet` på GitHub.
2. Push koden til `main`.
3. På GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   velg `main` og `/ (root)`. Lagre.
4. Etter ca. ett minutt er spillet live på `https://knekk.github.io/robotspillet/`.

Hver nye push til `main` oppdaterer siden automatisk.

## Lisens

MIT – se [LICENSE](LICENSE).
