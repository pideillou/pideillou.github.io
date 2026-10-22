// Réglages du jeu (en pixels et pixels par image à 60 images par seconde).
// Sur un écran plus rapide, chaque image avance d'une fraction de pas : le jeu garde la même vitesse.
const FRAME = 1000 / 60;
const MAX_STEP = 3;
const HEIGHT = 120;
const GROUND = 100;
const SCALE = 2;
const GRAVITY = 0.6;
const JUMP = -9.5;
// Flèche du bas en plein saut : le dino retombe plus vite.
const FAST_FALL = 1.2;
const START_SPEED = 4;
// La vitesse monte doucement puis plafonne (atteint en 40 secondes environ) : le jeu reste jouable.
const SPEED_GAIN = 0.002;
const MAX_SPEED = 9;
// Nombre d'images passées en l'air pendant un saut : sert à espacer les obstacles selon la vitesse.
const AIR_FRAMES = (2 * -JUMP) / GRAVITY;
// Les oiseaux arrivent à partir de ce score.
const BIRD_SCORE = 50;
const BIRD_CHANCE = 0.35;
// Délai avant de pouvoir relancer après une défaite (ms), pour lire le score.
const RESTART_DELAY = 400;

// Le T-rex pixel (12 × 12), même dessin que le curseur : [colonne, ligne, largeur] par segment.
const DINO = [
  [6, 0, 6], [5, 1, 2], [8, 1, 4], [5, 2, 7], [5, 3, 4], [5, 4, 6], [0, 5, 1], [4, 5, 4],
  [0, 6, 2], [3, 6, 6], [0, 7, 8], [1, 8, 6], [2, 9, 4], [2, 10, 2], [5, 10, 1], [2, 11, 2], [5, 11, 2],
];
const DINO_SIZE = 12 * SCALE;
// Baissé, le dino est écrasé à 18 px de haut.
const DUCK_SIZE = 18;
const DINO_X = 24;
// Marge des collisions, pour être indulgent.
const MARGIN = 4;

// L'oiseau pixel (10 × 8), deux positions d'ailes : [colonne, ligne, largeur].
const BIRD_FRAMES = [
  [[4, 0, 1], [4, 1, 2], [1, 2, 1], [4, 2, 3], [0, 3, 10], [3, 4, 6]],
  [[1, 2, 1], [0, 3, 10], [3, 4, 6], [4, 5, 3], [4, 6, 2], [4, 7, 1]],
];
const BIRD_WIDTH = 10 * SCALE;

/**
 * Dessin pixel ligne par ligne : « # » couleur du texte, « + » couleur atténuée (détails, fumée).
 * Converti en segments [colonne, ligne, largeur, couleur].
 * @param {string[]} rows
 */
const sprite = (rows) =>
  rows.flatMap((row, line) => [...row.matchAll(/#+|\++/g)].map((match) => [match.index, line, match[0].length, match[0][0] === '#' ? 'ink' : 'muted']));

// Les obstacles à la place des cactus : la vie d'un étudiant en MMI à Limoges.
// cause : affichée en fin de partie (« Battu par … »).
const OBSTACLES = [
  {
    cause: 'un bug en production',
    rows: [
      '.#.....#.',
      '..#...#..',
      '...###...',
      '#.#####.#',
      '.##+#+##.',
      '#.#####.#',
      '.#######.',
      '#..###..#',
    ],
  },
  {
    cause: 'le café de 2 h du matin',
    rows: [
      '.+..+...',
      '..+..+..',
      '.+..+...',
      '........',
      '######..',
      '#######.',
      '######.#',
      '######.#',
      '#######.',
      '######..',
      '.####...',
    ],
  },
  {
    cause: 'un point-virgule oublié',
    rows: [
      '.###.',
      '#####',
      '#####',
      '.###.',
      '.....',
      '.....',
      '.###.',
      '#####',
      '#####',
      '.####',
      '...##',
      '..##.',
      '.##..',
    ],
  },
  {
    cause: 'le matériel de tournage de MMI',
    rows: [
      '...###....',
      '.########.',
      '##########',
      '####++####',
      '###+##+###',
      '###+##+###',
      '####++####',
      '##########',
    ],
  },
  {
    cause: 'la deadline de la SAÉ',
    rows: [
      '.##.....##.',
      '###..#..###',
      '...#####...',
      '..#..+..#..',
      '.#...#...#.',
      '.#+..#..+#.',
      '.#...##..#.',
      '.#.......#.',
      '..#..+..#..',
      '...#####...',
      '..#.....#..',
      '.#.......#.',
    ],
  },
  {
    // Le bloc reste coincé dans un coin, loin des repères du centre.
    cause: 'une div impossible à centrer',
    rows: [
      '###########',
      '#....+....#',
      '#.###.....#',
      '#.###+....#',
      '#.###.....#',
      '#+.+.+.+.+#',
      '#.........#',
      '#....+....#',
      '#.........#',
      '#....+....#',
      '###########',
    ],
  },
  {
    // Ondes atténuées, barrées : plus de réseau.
    cause: 'le Wi-Fi de l’IUT',
    rows: [
      '..+++++++.#',
      '.+.......#.',
      '+..+++++#.+',
      '..+....#+..',
      '....++#....',
      '...+.#.+...',
      '....#......',
      '...#.+.....',
      '..#.+++....',
      '.#...+.....',
    ],
  },
].map(({ cause, rows }) => ({
  cause,
  shape: sprite(rows),
  width: rows[0].length * SCALE,
  height: rows.length * SCALE,
  // Les lignes sans « # » (fumée du café) ne comptent pas dans les collisions.
  solidFrom: rows.findIndex((row) => row.includes('#')) * SCALE,
}));
// Hauteur du haut du dessin. Bas : il faut sauter. Milieu : sauter ou se baisser. Haut : ne surtout pas sauter.
// L'oiseau du haut vole au niveau du sommet du saut (le dino monte d'environ 75 px) : impossible de passer au-dessus.
const BIRD_HEIGHTS = [82, 70, 16];
const BIRD_CAUSE = 'un pigeon de Limoges';

/**
 * Jeu du T-rex, dans le terminal : sauter par-dessus les obstacles et éviter les oiseaux.
 * Espace, flèche du haut ou tapotement pour sauter, flèche du bas pour se baisser, Échap pour quitter.
 */
export default class DinoGameView {
  #canvas;
  #context;
  #onEnd;
  #colors;
  #state;
  #width = 0;
  #ducking = false;
  #frame = 0;
  #last = 0;

  /**
   * @param {(score: number, cause: string) => void} onEnd Appelé à chaque fin de partie avec le score
   *   et l'obstacle qui a battu le joueur.
   */
  constructor(onEnd) {
    this.#onEnd = onEnd;
    this.#canvas = document.createElement('canvas');
    this.#canvas.tabIndex = 0;
    this.#canvas.className = 'mt-1 box-content block h-30 w-full rounded-md border border-muted/30 focus-visible:outline-2 focus-visible:outline-accent';
    this.#canvas.setAttribute('role', 'img');
    this.#canvas.setAttribute(
      'aria-label',
      'Jeu du dinosaure : Espace ou flèche du haut pour sauter, flèche du bas pour se baisser, Échap pour quitter.',
    );
    this.#context = this.#canvas.getContext('2d');

    // Les touches du jeu ne vont pas plus loin (codes secrets, raccourcis de la page).
    this.#canvas.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) this.#jump();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        this.#ducking = true;
      } else if (event.key === 'Escape') {
        event.stopPropagation();
        this.stop();
      }
    });
    this.#canvas.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowDown') this.#ducking = false;
    });
    this.#canvas.addEventListener('blur', () => {
      this.#ducking = false;
    });
    this.#canvas.addEventListener('pointerdown', () => this.#jump());
  }

  /** @returns {HTMLCanvasElement} À insérer dans la page avant start(). */
  get element() {
    return this.#canvas;
  }

  /** Lance une partie (le canvas doit être dans la page). */
  start() {
    this.#resize();
    const css = getComputedStyle(document.documentElement);
    this.#colors = {
      ink: css.getPropertyValue('--color-ink').trim(),
      muted: css.getPropertyValue('--color-muted').trim(),
      accent: css.getPropertyValue('--color-accent').trim(),
    };
    this.#state = { y: GROUND - DINO_SIZE, vy: 0, obstacles: [], speed: START_SPEED, ticks: 0, score: 0, over: false, endedAt: 0, cause: '' };
    this.#canvas.focus();
    cancelAnimationFrame(this.#frame);
    this.#last = performance.now();
    this.#frame = requestAnimationFrame((now) => this.#loop(now));
  }

  /** Arrête le jeu et retire le canvas. */
  stop() {
    cancelAnimationFrame(this.#frame);
    this.#canvas.remove();
  }

  // Canvas net sur les écrans haute densité : plus de pixels, même taille à l'écran.
  #resize() {
    const ratio = window.devicePixelRatio || 1;
    this.#width = this.#canvas.clientWidth;
    this.#canvas.width = Math.round(this.#width * ratio);
    this.#canvas.height = Math.round(HEIGHT * ratio);
    this.#context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  #jump() {
    const state = this.#state;
    if (!state) return;
    if (state.over) {
      if (performance.now() - state.endedAt > RESTART_DELAY) this.start();
      return;
    }
    if (state.y >= GROUND - DINO_SIZE) state.vy = JUMP;
  }

  /** @param {number} speed */
  #spawn(speed) {
    // Écart après l'obstacle : toujours de quoi retomber entre deux obstacles, à toutes les vitesses.
    const gap = speed * AIR_FRAMES + DINO_SIZE + 20 + Math.random() * (120 + speed * 20);
    const x = this.#width + 10;
    if (this.#state.score >= BIRD_SCORE && Math.random() < BIRD_CHANCE) {
      const top = BIRD_HEIGHTS[Math.floor(Math.random() * BIRD_HEIGHTS.length)];
      // Zone touchée : le corps et les ailes à l'horizontale (lignes 2 à 5 du dessin).
      return { bird: true, cause: BIRD_CAUSE, x, width: BIRD_WIDTH, top, hitTop: top + 2 * SCALE, hitBottom: top + 6 * SCALE, gap };
    }
    const { cause, shape, width, height, solidFrom } = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
    const top = GROUND - height;
    return { bird: false, cause, shape, x, width, top, hitTop: top + solidFrom, hitBottom: GROUND, gap };
  }

  /** @param {number} now Horodatage de l'image (ms). */
  #loop(now) {
    // Canvas retiré (clear, fermeture) : on arrête.
    if (!this.#canvas.isConnected) return;
    // Terminal fermé : le jeu se met en pause et reprend à la réouverture.
    if (this.#canvas.getClientRects().length === 0) {
      this.#last = now;
      this.#frame = requestAnimationFrame((next) => this.#loop(next));
      return;
    }
    const state = this.#state;
    const step = Math.min((now - this.#last) / FRAME, MAX_STEP);
    this.#last = now;

    state.ticks += step;
    state.score = Math.floor(state.ticks / 6);
    state.speed = Math.min(state.speed + SPEED_GAIN * START_SPEED * step, MAX_SPEED);
    state.vy += (this.#ducking && state.vy > JUMP / 2 ? GRAVITY * FAST_FALL : GRAVITY) * step;
    state.y = Math.min(state.y + state.vy * step, GROUND - DINO_SIZE);

    // Nouvel obstacle quand le précédent s'est assez éloigné du bord droit.
    const last = state.obstacles.at(-1);
    if (!last || last.x + last.width + last.gap < this.#width) state.obstacles.push(this.#spawn(state.speed));
    state.obstacles.forEach((obstacle) => {
      obstacle.x -= state.speed * step;
    });
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);

    const dino = this.#dinoBox();
    const hit = state.obstacles.find(
      (obstacle) =>
        obstacle.x < dino.right &&
        obstacle.x + obstacle.width > dino.left &&
        obstacle.hitTop < dino.bottom &&
        obstacle.hitBottom > dino.top,
    );

    this.#draw();
    if (hit) {
      state.over = true;
      state.endedAt = now;
      state.cause = hit.cause;
      this.#drawGameOver();
      this.#onEnd(state.score, hit.cause);
      return;
    }
    this.#frame = requestAnimationFrame((next) => this.#loop(next));
  }

  // Baissé seulement au sol.
  get #isDucking() {
    return this.#ducking && this.#state.y >= GROUND - DINO_SIZE;
  }

  /** Zone touchée du dino, un peu plus petite que son dessin. */
  #dinoBox() {
    const top = this.#isDucking ? GROUND - DUCK_SIZE : this.#state.y;
    return {
      left: DINO_X + MARGIN,
      right: DINO_X + DINO_SIZE - MARGIN,
      top: top + MARGIN,
      bottom: this.#state.y + DINO_SIZE - MARGIN,
    };
  }

  #draw() {
    const width = this.#width;
    const context = this.#context;
    const state = this.#state;
    context.clearRect(0, 0, width, HEIGHT);

    context.fillStyle = this.#colors.muted;
    context.fillRect(0, GROUND, width, 1);
    context.font = '12px monospace';
    context.textAlign = 'right';
    context.fillText(String(state.score).padStart(5, '0'), width - 8, 16);

    // Les ailes battent environ 4 fois par seconde.
    const wings = Math.floor(state.ticks / 8) % 2;
    state.obstacles.forEach((obstacle) => {
      const shape = obstacle.bird ? BIRD_FRAMES[wings] : obstacle.shape;
      shape.forEach(([column, row, length, color = 'ink']) => {
        context.fillStyle = this.#colors[color];
        context.fillRect(obstacle.x + column * SCALE, obstacle.top + row * SCALE, length * SCALE, SCALE);
      });
    });

    // Baissé : même dessin, écrasé en hauteur.
    const ducking = this.#isDucking;
    const row = ducking ? DUCK_SIZE / 12 : SCALE;
    const top = ducking ? GROUND - DUCK_SIZE : state.y;
    context.fillStyle = this.#colors.accent;
    DINO.forEach(([column, line, length]) => {
      context.fillRect(DINO_X + column * SCALE, top + line * row, length * SCALE, row);
    });
  }

  #drawGameOver() {
    const context = this.#context;
    context.fillStyle = this.#colors.ink;
    context.textAlign = 'center';
    context.font = '13px monospace';
    const { score, cause } = this.#state;
    context.fillText(`GAME OVER · ${score} point${score > 1 ? 's' : ''}`, this.#width / 2, 36);
    context.fillStyle = this.#colors.accent;
    context.font = '11px monospace';
    context.fillText(`Battu par ${cause}`, this.#width / 2, 54);
    context.fillStyle = this.#colors.muted;
    context.fillText('Espace pour rejouer · Échap pour quitter', this.#width / 2, 70);
  }
}
