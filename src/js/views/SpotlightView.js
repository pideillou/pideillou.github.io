/**
 * Lampe qui suit la souris : un halo fixe à l'écran et des calques de « coulisses »
 * (un par section) qui défilent avec la page, visibles seulement dans le rond de la lampe.
 * Les positions sont passées au CSS par des variables (--spot-x/y, --reveal-x/y).
 */
export default class SpotlightView {
  #halo;
  #reveals;
  #toggle;
  #pointer = null;

  /**
   * @param {HTMLElement} halo Calque fixe [data-spotlight].
   * @param {HTMLElement[]} reveals Calques des coulisses [data-reveal].
   * @param {HTMLButtonElement} toggle Interrupteur [data-lamp-toggle].
   */
  constructor(halo, reveals, toggle) {
    this.#halo = halo;
    this.#reveals = reveals;
    this.#toggle = toggle;
  }

  /** @param {{ on: boolean }} state */
  render({ on }) {
    this.#halo.toggleAttribute('data-on', on);
    this.#reveals.forEach((reveal) => reveal.toggleAttribute('data-on', on));
    this.#toggle.setAttribute('aria-pressed', String(on));
  }

  /**
   * Place la lampe sous le pointeur (coordonnées de l'écran).
   * @param {{ x: number, y: number }} position
   */
  move({ x, y }) {
    this.#pointer = { x, y };
    this.#halo.style.setProperty('--spot-x', `${x}px`);
    this.#halo.style.setProperty('--spot-y', `${y}px`);
    this.#halo.toggleAttribute('data-active', true);

    // Les calques des coulisses défilent : on convertit en coordonnées de chaque calque.
    // Seuls ceux qui croisent l'écran sont mis à jour.
    this.#reveals.forEach((reveal) => {
      const box = reveal.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      reveal.style.setProperty('--reveal-x', `${x - box.left}px`);
      reveal.style.setProperty('--reveal-y', `${y - box.top}px`);
    });
  }

  /** Masque le halo (souris sortie de la fenêtre). */
  hide() {
    this.#halo.toggleAttribute('data-active', false);
  }

  /** @param {() => void} handler */
  bindToggle(handler) {
    this.#toggle.addEventListener('click', handler);
  }

  /**
   * Mouvements de la souris et défilement, limités à une mise à jour par image affichée.
   * @param {(position: { x: number, y: number }) => void} onMove
   * @param {() => void} onLeave
   */
  bindPointer(onMove, onLeave) {
    let pending = null;
    const schedule = (position) => {
      if (pending === null) requestAnimationFrame(() => {
        onMove(pending);
        pending = null;
      });
      pending = position;
    };

    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType === 'mouse') schedule({ x: event.clientX, y: event.clientY });
      },
      { passive: true },
    );
    // Au défilement, la souris ne bouge pas mais les coulisses si : on recale la lampe.
    window.addEventListener(
      'scroll',
      () => {
        if (this.#pointer) schedule(this.#pointer);
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', onLeave);
  }
}
