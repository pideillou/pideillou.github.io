// Durée de rotation du premier rouleau, puis délai entre deux arrêts (ms).
const SPIN_DURATION = 1600;
const STOP_GAP = 600;
const FADE_DURATION = 300;

// Classes complètes d'un symbole (jamais construites dynamiquement).
const SYMBOL_CLASSES =
  'flex h-14 items-center justify-center px-1 text-center font-display text-sm leading-tight font-bold text-surface sm:text-lg';

// Jackpot : nombre de jetons qui tombent et leurs classes, alternées.
const COIN_COUNT = 40;
const COIN_CLASSES = [
  'absolute top-0 left-0 size-3 rounded-full bg-accent',
  'absolute top-0 left-0 size-2 rounded-full bg-support',
  'absolute top-0 left-0 size-3 rounded-sm bg-ink',
  'absolute top-0 left-0 size-2 rounded-sm bg-muted',
];
const JACKPOT_STATUS_CLASSES = ['font-display', 'text-2xl', 'font-bold'];

/**
 * Écran de chargement en machine à sous, affiché dans un <dialog> modal :
 * showModal() rend le reste de la page inerte et place le focus dans la fenêtre.
 */
export default class SlotLoaderView {
  #dialog;
  #reels;
  #status;
  #skip;
  #machine;
  #payline;
  #coins;
  #animations = [];

  /** @param {HTMLDialogElement} dialog */
  constructor(dialog) {
    this.#dialog = dialog;
    this.#reels = [...dialog.querySelectorAll('[data-reel]')];
    this.#status = dialog.querySelector('[data-slot-status]');
    this.#skip = dialog.querySelector('[data-slot-skip]');
    this.#machine = dialog.querySelector('[data-slot-machine]');
    this.#payline = dialog.querySelector('[data-slot-payline]');
    this.#coins = dialog.querySelector('[data-slot-coins]');
  }

  /** Affiche l'écran de chargement par-dessus la page. */
  open() {
    this.#status.textContent = 'Tirage des compétences en cours…';
    this.#dialog.showModal();
  }

  /**
   * Remplit les rouleaux puis les fait tourner ; ils s'arrêtent l'un après l'autre.
   * @param {string[][]} reels Une bande de symboles par rouleau.
   * @returns {Promise<boolean>} Vrai si tous les rouleaux se sont arrêtés, faux si interrompu.
   */
  async spin(reels) {
    this.#animations = reels.map((symbols, index) => {
      const strip = this.#reels[index];
      strip.replaceChildren(...symbols.map((name) => this.#createSymbol(name)));

      // Le symbole gagnant (avant-dernier) doit finir sur la ligne du milieu.
      const height = strip.firstElementChild.getBoundingClientRect().height;
      const distance = (symbols.length - 3) * height;

      return strip.animate(
        [{ transform: 'translateY(0)' }, { transform: `translateY(-${distance}px)` }],
        {
          duration: SPIN_DURATION + index * STOP_GAP,
          easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
          fill: 'forwards',
        },
      );
    });

    try {
      await Promise.all(this.#animations.map((animation) => animation.finished));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Annonce le résultat dans la zone role="status".
   * @param {string[]} result
   */
  announce(result) {
    const list = `${result.slice(0, -1).join(', ')} et ${result.at(-1)}`;
    this.#status.textContent = `Compétences tirées : ${list}.`;
  }

  /**
   * Easter egg du jackpot : annonce, symboles gagnants qui pulsent,
   * ligne de gain qui clignote et pluie de jetons.
   * @param {string} skill Compétence sortie sur tous les rouleaux.
   */
  celebrate(skill) {
    this.#status.classList.add(...JACKPOT_STATUS_CLASSES);
    this.#status.classList.replace('text-muted', 'text-accent');
    this.#status.textContent = `Jackpot ! Trois fois ${skill}.`;

    const winners = this.#reels.map((strip) => strip.children[strip.children.length - 2]);
    const pulses = winners.map((symbol) =>
      symbol.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        { duration: 500, iterations: 4, easing: 'ease-in-out' },
      ),
    );
    const blink = this.#payline.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], {
      duration: 300,
      iterations: 8,
    });
    const shake = this.#machine.animate(
      [
        { transform: 'rotate(0)' },
        { transform: 'rotate(-2deg)' },
        { transform: 'rotate(2deg)' },
        { transform: 'rotate(0)' },
      ],
      { duration: 250, iterations: 3 },
    );

    this.#animations = [...pulses, blink, shake, ...this.#rainCoins()];
  }

  /**
   * Fait tomber des jetons décoratifs sur toute la hauteur de l'écran.
   * @returns {Animation[]}
   */
  #rainCoins() {
    const { clientWidth: width, clientHeight: height } = this.#coins;
    const coins = Array.from({ length: COIN_COUNT }, (_, index) => {
      const coin = document.createElement('span');
      coin.className = COIN_CLASSES[index % COIN_CLASSES.length];
      return coin;
    });
    this.#coins.replaceChildren(...coins);

    return coins.map((coin) => {
      const x = Math.random() * width;
      const drift = (Math.random() - 0.5) * 120;
      return coin.animate(
        [
          { transform: `translate(${x}px, -20px) rotate(0deg)` },
          { transform: `translate(${x + drift}px, ${height + 20}px) rotate(720deg)` },
        ],
        {
          duration: 1800 + Math.random() * 1200,
          delay: Math.random() * 800,
          easing: 'cubic-bezier(0.3, 0, 0.7, 1)',
          fill: 'both',
        },
      );
    });
  }

  /**
   * Ferme l'écran de chargement avec un fondu.
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.#dialog.animate([{ opacity: 1 }, { opacity: 0 }], FADE_DURATION).finished;
    } catch {
      // Fondu interrompu : on ferme quand même.
    }
    this.#dialog.close();
    // Nettoyage seulement une fois invisible : annuler plus tôt ramènerait
    // les rouleaux à leur position de départ pendant le fondu.
    this.#animations.forEach((animation) => animation.cancel());
    this.#coins.replaceChildren();
  }

  /**
   * Bouton « Passer l'animation » et touche Échap.
   * @param {() => void} handler
   */
  bindSkip(handler) {
    this.#skip.addEventListener('click', handler);
    this.#dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      handler();
    });
  }

  /**
   * @param {string} name
   * @returns {HTMLLIElement}
   */
  #createSymbol(name) {
    const item = document.createElement('li');
    item.className = SYMBOL_CLASSES;
    item.textContent = name;
    return item;
  }
}
