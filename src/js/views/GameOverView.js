import { pickRandom } from '../utils/random.js';

// Périmètre du cercle du compte à rebours (2 × π × 34), en unités du SVG.
const RING = 213.6;

// « 404 » en pixels : 5 × 7 par chiffre, une colonne vide entre deux chiffres (17 colonnes).
const DIGITS = {
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
};
const GRID_CLASSES = 'grid grid-cols-17 gap-0.5 sm:gap-1';
const EMPTY_CLASSES = 'size-3 sm:size-4';
// Nuances des blocs, tirées au hasard (classes complètes, jamais construites).
const BLOCK_CLASSES = [
  'size-3 rounded-xs bg-accent sm:size-4',
  'size-3 rounded-xs bg-accent/80 sm:size-4',
  'size-3 rounded-xs bg-accent/60 sm:size-4',
];
// Chute d'un bloc et décalage entre deux rangées (ms) : on empile du bas vers le haut.
const FALL = 550;
const ROW_DELAY = 120;

/**
 * Page 404 « Game over » : les blocs du « 404 » tombent du haut de l'écran et s'empilent,
 * puis le titre s'affiche ; compte à rebours façon borne d'arcade, indice de secret.
 * Le compte à rebours et les blocs n'existent qu'avec le JS ; sans lui, le texte et les liens suffisent.
 */
export default class GameOverView {
  #reducedMotion;
  #pixels;
  #title;
  #countdown;
  #number;
  #ring;
  #status;
  #stop;
  #hint;

  /**
   * @param {HTMLElement} root Conteneur [data-game-over].
   * @param {{ reducedMotion: boolean }} options
   */
  constructor(root, { reducedMotion }) {
    this.#reducedMotion = reducedMotion;
    this.#pixels = root.querySelector('[data-pixels]');
    this.#title = root.querySelector('[data-title]');
    this.#countdown = root.querySelector('[data-countdown]');
    this.#number = root.querySelector('[data-countdown-number]');
    this.#ring = root.querySelector('[data-countdown-ring]');
    this.#status = root.querySelector('[data-countdown-status]');
    this.#stop = root.querySelector('[data-countdown-stop]');
    this.#hint = root.querySelector('[data-hint]');
    // Visuel seulement : les lecteurs d'écran ont le message de la zone de statut.
    this.#countdown.setAttribute('aria-hidden', 'true');
    this.#countdown.hidden = false;
    this.#stop.hidden = false;
  }

  /** Arrivée : les blocs tombent rangée par rangée, la pile tressaute, puis « Game over » apparaît. */
  intro() {
    const { grid, blocks, rows } = this.#buildPixels();
    if (this.#reducedMotion) return;

    // Les blocs partent d'au-dessus de l'écran.
    const drop = grid.getBoundingClientRect().bottom + 40;
    let last = 0;
    blocks.forEach(({ cell, row }) => {
      const delay = (rows - 1 - row) * ROW_DELAY + Math.random() * 90;
      last = Math.max(last, delay);
      cell.animate([{ transform: `translateY(-${drop}px)` }, { transform: 'translateY(0)' }], {
        duration: FALL,
        delay,
        easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        fill: 'backwards',
      });
    });
    const landed = last + FALL;
    grid.animate([{ transform: 'none' }, { transform: 'translateY(5px)' }, { transform: 'none' }], { duration: 220, delay: landed });
    this.#title.animate(
      [
        { opacity: 0, transform: 'scale(1.25)', letterSpacing: '0.3em' },
        { opacity: 1, transform: 'none', letterSpacing: '-0.025em' },
      ],
      { duration: 450, delay: landed + 120, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
    );
  }

  /** @param {{ remaining: number, total: number, running: boolean }} state */
  render({ remaining, total, running }) {
    this.#number.textContent = running ? String(remaining) : '∞';
    // Le cercle se vide à chaque seconde (valeur calculée, passée au CSS par une variable).
    this.#ring.style.setProperty('--ring', String(running ? RING * (1 - remaining / total) : 0));
    this.#stop.hidden = !running;
  }

  /** @param {string} text Message lu par les lecteurs d'écran. */
  announce(text) {
    this.#status.textContent = text;
  }

  /** @param {string} text */
  showHint(text) {
    this.#hint.textContent = text;
  }

  /**
   * Le visiteur reprend la main : bouton « Rester ici », ou n'importe quelle touche ou clic.
   * @param {() => void} handler
   */
  bindStop(handler) {
    this.#stop.addEventListener('click', handler);
    document.addEventListener('keydown', handler, { once: true });
    document.addEventListener('pointerdown', handler, { once: true });
  }

  /** @param {string} url */
  go(url) {
    window.location.assign(url);
  }

  // Remplace le texte « 404 » par une grille de blocs.
  #buildPixels() {
    const rows = DIGITS[4].length;
    const grid = document.createElement('div');
    grid.className = GRID_CLASSES;
    const blocks = [];
    const cell = (className) => {
      const span = document.createElement('span');
      span.className = className;
      grid.append(span);
      return span;
    };
    for (let row = 0; row < rows; row += 1) {
      ['4', '0', '4'].forEach((digit, index) => {
        [...DIGITS[digit][row]].forEach((pixel) => {
          if (pixel === '#') blocks.push({ cell: cell(pickRandom(BLOCK_CLASSES)), row });
          else cell(EMPTY_CLASSES);
        });
        if (index < 2) cell(EMPTY_CLASSES);
      });
    }
    this.#pixels.className = '';
    this.#pixels.replaceChildren(grid);
    return { grid, blocks, rows };
  }
}
