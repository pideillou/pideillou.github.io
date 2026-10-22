// Réglages du jeu.
const HEIGHT = 120;
const CELL = 12;
// Un déplacement toutes les 140 ms au départ, quelle que soit la fréquence de l'écran.
// Le serpent accélère avec le temps de jeu (1,5 ms de moins par seconde) jusqu'à 85 ms, sa vitesse maximale.
const START_STEP = 140;
const MIN_STEP = 85;
const STEP_GAIN = 1.5 / 1000;
const SWIPE = 20; // distance minimale d'un glissé au doigt (px)
// Virages gardés en mémoire quand on tape plusieurs flèches pendant un même pas.
const MAX_TURNS = 2;
const RESTART_DELAY = 400; // délai avant de pouvoir relancer après une défaite (ms)

const DIRECTIONS = {
  arrowup: [0, -1],
  arrowdown: [0, 1],
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  z: [0, -1],
  s: [0, 1],
  q: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  a: [-1, 0],
};

/**
 * Jeu du serpent, dans le terminal : manger les pastilles sans se mordre ni toucher les bords.
 * Flèches (ou ZQSD / WASD), glissé au doigt sur mobile, Échap pour quitter.
 */
export default class SnakeGameView {
  #canvas;
  #context;
  #onEnd;
  #colors;
  #state;
  #width = 0;
  #frame = 0;

  /** @param {(score: number) => void} onEnd Appelé à chaque fin de partie avec le score. */
  constructor(onEnd) {
    this.#onEnd = onEnd;
    this.#canvas = document.createElement('canvas');
    this.#canvas.tabIndex = 0;
    this.#canvas.className = 'mt-1 box-content block h-30 w-full touch-none rounded-md border border-muted/30 focus-visible:outline-2 focus-visible:outline-accent';
    this.#canvas.setAttribute('role', 'img');
    this.#canvas.setAttribute('aria-label', 'Jeu du serpent : flèches pour diriger, Espace pour rejouer, Échap pour quitter.');
    this.#context = this.#canvas.getContext('2d');

    // Les touches du jeu ne vont pas plus loin (code Konami, raccourcis de la page).
    this.#canvas.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'escape') {
        event.stopPropagation();
        this.stop();
      } else if (key === ' ' && this.#state?.over) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) this.#restart();
      } else if (DIRECTIONS[key]) {
        event.preventDefault();
        event.stopPropagation();
        this.#turn(DIRECTIONS[key]);
      }
    });

    // Glissé au doigt : la direction suit le mouvement le plus long.
    let origin = null;
    this.#canvas.addEventListener('pointerdown', (event) => {
      origin = { x: event.clientX, y: event.clientY };
      if (this.#state?.over) this.#restart();
    });
    this.#canvas.addEventListener('pointerup', (event) => {
      if (!origin) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      origin = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
      this.#turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
    });
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
      online: css.getPropertyValue('--color-online').trim(),
    };
    const columns = Math.floor(this.#width / CELL);
    const rows = Math.floor(HEIGHT / CELL);
    const y = Math.floor(rows / 2);
    this.#state = {
      columns,
      rows,
      snake: [{ x: 4, y }, { x: 3, y }, { x: 2, y }],
      direction: [1, 0],
      turns: [],
      food: null,
      score: 0,
      over: false,
      endedAt: 0,
      last: performance.now(),
      elapsed: 0,
      played: 0,
    };
    this.#placeFood();
    this.#canvas.focus();
    cancelAnimationFrame(this.#frame);
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

  #restart() {
    if (performance.now() - this.#state.endedAt > RESTART_DELAY) this.start();
  }

  /**
   * Garde le virage pour les prochains pas : deux flèches tapées vite (bas puis gauche) comptent toutes les deux.
   * @param {number[]} direction
   */
  #turn([x, y]) {
    const { turns, direction } = this.#state;
    const [currentX, currentY] = turns.at(-1) ?? direction;
    // Pas de demi-tour sur place, ni de virage répété.
    if ((x === -currentX && y === -currentY) || (x === currentX && y === currentY)) return;
    if (turns.length < MAX_TURNS) turns.push([x, y]);
  }

  /** Durée d'un pas selon le temps déjà joué (ms). */
  #step() {
    return Math.max(START_STEP - this.#state.played * STEP_GAIN, MIN_STEP);
  }

  #placeFood() {
    const { columns, rows, snake } = this.#state;
    let food;
    do {
      food = { x: Math.floor(Math.random() * columns), y: Math.floor(Math.random() * rows) };
    } while (snake.some((part) => part.x === food.x && part.y === food.y));
    this.#state.food = food;
  }

  /** @param {number} now */
  #loop(now) {
    if (!this.#canvas.isConnected) return;
    const state = this.#state;
    // Terminal fermé : le jeu se met en pause et reprend à la réouverture.
    if (this.#canvas.getClientRects().length === 0) {
      state.last = now;
      this.#frame = requestAnimationFrame((next) => this.#loop(next));
      return;
    }
    // Onglet en arrière-plan : on ne rattrape pas plus d'une demi-seconde.
    state.elapsed += Math.min(now - state.last, 500);
    state.last = now;

    while (state.elapsed >= this.#step() && !state.over) {
      const step = this.#step();
      state.elapsed -= step;
      state.played += step;
      state.direction = state.turns.shift() ?? state.direction;
      const head = { x: state.snake[0].x + state.direction[0], y: state.snake[0].y + state.direction[1] };
      const outside = head.x < 0 || head.y < 0 || head.x >= state.columns || head.y >= state.rows;
      const bitten = state.snake.some((part) => part.x === head.x && part.y === head.y);
      if (outside || bitten) {
        state.over = true;
        state.endedAt = now;
        break;
      }
      state.snake.unshift(head);
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 1;
        this.#placeFood();
      } else {
        state.snake.pop();
      }
    }

    this.#draw();
    if (state.over) {
      this.#drawGameOver();
      this.#onEnd(state.score);
      return;
    }
    this.#frame = requestAnimationFrame((next) => this.#loop(next));
  }

  #draw() {
    const width = this.#width;
    const context = this.#context;
    const state = this.#state;
    context.clearRect(0, 0, width, HEIGHT);

    context.fillStyle = this.#colors.muted;
    context.font = '12px monospace';
    context.textAlign = 'right';
    context.fillText(String(state.score).padStart(3, '0'), width - 8, 14);

    context.fillStyle = this.#colors.online;
    context.fillRect(state.food.x * CELL + 3, state.food.y * CELL + 3, CELL - 6, CELL - 6);

    state.snake.forEach((part, index) => {
      context.fillStyle = index === 0 ? this.#colors.accent : this.#colors.ink;
      context.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  #drawGameOver() {
    const context = this.#context;
    context.fillStyle = this.#colors.ink;
    context.textAlign = 'center';
    context.font = '13px monospace';
    const { score } = this.#state;
    context.fillText(`GAME OVER · ${score} point${score > 1 ? 's' : ''}`, this.#width / 2, 50);
    context.fillStyle = this.#colors.muted;
    context.font = '11px monospace';
    context.fillText('Espace ou tapotement pour rejouer · Échap pour quitter', this.#width / 2, 70);
  }
}
