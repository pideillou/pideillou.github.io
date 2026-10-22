// Chute de la météorite (ms) et durée d'affichage du message.
const FALL = 900;
const CAPTION_TIME = 2400;
// Longueur de la traînée (px), pour placer la tête de la météorite.
const TRAIL = 192;

const METEOR_CLASSES =
  'pointer-events-none fixed top-0 left-0 z-50 h-1.5 w-48 origin-right rounded-full bg-linear-to-r from-transparent via-gold to-gold-light shadow-[0_0_30px_8px_var(--color-gold)]';
const FLASH_CLASSES = 'pointer-events-none fixed inset-0 z-50 bg-gold-light opacity-0';
const CAPTION_CLASSES =
  'pointer-events-none fixed inset-x-4 top-1/3 z-50 mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-accent/40 bg-surface/95 px-8 py-6 text-center shadow-2xl';

// Secousse de la page à l'impact.
const SHAKE = [0, -12, 10, -8, 6, -4, 2, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 5 : -5}px)` }));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Secret « extinction » : une météorite traverse l'écran, flash, secousse,
 * puis le message. Sans animation (prefers-reduced-motion), seul le message s'affiche.
 */
export default class ExtinctionView {
  #reducedMotion;

  /** @param {{ reducedMotion: boolean }} options */
  constructor({ reducedMotion }) {
    this.#reducedMotion = reducedMotion;
  }

  /**
   * @param {{ onImpact: () => void }} handlers onImpact : appelé quand la météorite touche le sol.
   * @returns {Promise<void>} Résolue quand l'effet est terminé.
   */
  async play({ onImpact }) {
    if (!this.#reducedMotion) {
      await this.#fall();
      this.#impact();
    }
    onImpact();
    await this.#caption();
  }

  async #fall() {
    const meteor = this.#layer(METEOR_CLASSES);
    meteor.setAttribute('aria-hidden', 'true');
    const from = { x: window.innerWidth + 60, y: -120 };
    const to = { x: window.innerWidth * 0.32, y: window.innerHeight * 0.72 };
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    // La traînée tourne autour de sa tête (origin-right) : on place la tête sur le trajet.
    const at = ({ x, y }) => `translate(${x - TRAIL}px, ${y}px) rotate(${angle}deg)`;
    await meteor.animate([{ transform: at(from) }, { transform: at(to) }], { duration: FALL, easing: 'cubic-bezier(0.5, 0, 1, 1)' })
      .finished;
    meteor.remove();
  }

  #impact() {
    const flash = this.#layer(FLASH_CLASSES);
    flash.setAttribute('aria-hidden', 'true');
    flash
      .animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.15 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' })
      .finished.then(() => flash.remove());
    // On secoue le contenu, pas <body> : les éléments fixes (terminal, nav) restent en place.
    document.getElementById('contenu')?.animate(SHAKE, { duration: 600 });
  }

  async #caption() {
    const caption = this.#layer(CAPTION_CLASSES);
    caption.setAttribute('role', 'status');
    // Le texte arrive après la zone annoncée, pour que les lecteurs d'écran le lisent.
    await wait(50);
    const title = document.createElement('p');
    title.className = 'font-display text-5xl text-accent italic sm:text-6xl';
    title.textContent = 'Extinction.';
    const text = document.createElement('p');
    text.className = 'font-mono text-sm text-ink';
    text.textContent = 'Les dinosaures ont disparu. Le curseur aussi.';
    caption.append(title, text);

    if (!this.#reducedMotion) {
      caption.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    }
    await wait(CAPTION_TIME);
    if (!this.#reducedMotion) await caption.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).finished;
    caption.remove();
  }

  // Calque plein écran : data-overlay empêche l'économiseur d'écran de démarrer par-dessus.
  #layer(className) {
    const layer = document.createElement('div');
    layer.className = className;
    layer.dataset.overlay = '';
    document.body.append(layer);
    return layer;
  }
}
