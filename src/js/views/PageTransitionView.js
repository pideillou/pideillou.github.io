// Durées (ms) : visuel qui s'agrandit, visuel qui se range, page qui glisse.
const EXPAND = 420;
const SHRINK = 520;
const SLIDE = 220;
const EASE = 'cubic-bezier(0.7, 0, 0.3, 1)';
// Si la page suivante tarde, on rend la main au visiteur au lieu de le laisser devant un écran figé (ms).
const SAFETY = 4000;

const OVERLAY_CLASSES = 'pointer-events-none fixed z-50 overflow-hidden border border-muted/30 bg-surface';
// Décalage de la page à la sortie et à l'arrivée, selon le sens (fiche suivante, précédente, retour).
const SLIDES = {
  next: { out: '-48px, 0', in: '48px, 0' },
  previous: { out: '48px, 0', in: '-48px, 0' },
  back: { out: '0, 16px', in: '0, -16px' },
};

/**
 * Transitions entre l'accueil et les fiches projet, sans écran de chargement :
 * - ouvrir un projet : son visuel s'agrandit jusqu'à remplir l'écran,
 *   puis, sur la fiche, le même visuel se range à sa place ;
 * - passer d'une fiche à l'autre : la page glisse comme une page qu'on tourne.
 * Sans animation (prefers-reduced-motion), la navigation est immédiate.
 */
export default class PageTransitionView {
  #reducedMotion;
  #busy = false;
  #layers = [];
  #animations = [];

  /** @param {{ reducedMotion: boolean }} options */
  constructor({ reducedMotion }) {
    this.#reducedMotion = reducedMotion;
    // Retour arrière servi par le cache du navigateur : la page revient telle qu'on l'a quittée,
    // transition comprise. On la remet en état.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) this.reset();
    });
  }

  /**
   * Clics sur les liens [data-transition] ouverts dans le même onglet.
   * @param {(link: HTMLAnchorElement) => void} handler
   */
  bindLinks(handler) {
    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[data-transition]');
      if (!link || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      event.preventDefault();
      if (this.#busy) return;
      this.#busy = true;
      handler(link);
    });
  }

  /**
   * Ouvre une adresse après l'animation de sortie.
   * @param {string} url
   */
  navigate(url) {
    window.location.assign(url);
    setTimeout(() => this.reset(), SAFETY);
  }

  /**
   * Sortie vers une fiche : le visuel du projet s'agrandit jusqu'à remplir l'écran.
   * @param {Element | null} cover Conteneur du visuel [data-cover].
   */
  async expand(cover) {
    const art = cover?.querySelector('svg, img');
    if (this.#reducedMotion || !art) return;
    const box = cover.getBoundingClientRect();
    const layer = this.#layer(art);
    await this.#play(layer, [this.#frame(box, '0.5rem'), this.#fullScreen()], { duration: EXPAND, fill: 'forwards' });
  }

  /**
   * Arrivée sur une fiche : le visuel plein écran se range à sa place, puis le reste apparaît.
   * @param {Element} hero Visuel principal de la fiche.
   * @param {Element[]} parts Blocs qui apparaissent ensuite, dans l'ordre.
   */
  async shrink(hero, parts) {
    const art = hero?.querySelector('svg, img');
    if (this.#reducedMotion || !art) return;
    const layer = this.#layer(art);
    this.#play(hero, [{ opacity: 0 }, { opacity: 0 }], { duration: SHRINK });
    this.#reveal(parts, SHRINK * 0.6);
    await this.#play(layer, [this.#fullScreen(), this.#frame(hero.getBoundingClientRect(), '0.5rem')], { duration: SHRINK });
    layer.remove();
  }

  /**
   * Sortie vers une autre page : le contenu glisse et s'efface.
   * @param {string} direction next, previous ou back.
   */
  async slideOut(direction) {
    if (this.#reducedMotion) return;
    const offset = (SLIDES[direction] ?? SLIDES.back).out;
    await Promise.all(
      this.#pageParts().map((part) =>
        this.#play(part, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate(${offset})` }], { duration: SLIDE, fill: 'forwards' }),
      ),
    );
  }

  /**
   * Arrivée par glissement, dans le sens inverse de la sortie.
   * @param {string} direction next, previous ou back.
   */
  slideIn(direction) {
    if (this.#reducedMotion) return;
    const offset = (SLIDES[direction] ?? SLIDES.back).in;
    this.#pageParts().forEach((part) =>
      this.#play(part, [{ opacity: 0, transform: `translate(${offset})` }, { opacity: 1, transform: 'none' }], { duration: SLIDE * 1.5 }),
    );
  }

  /** Retire les calques et annule les animations (retour arrière, navigation annulée). */
  reset() {
    this.#layers.forEach((layer) => layer.remove());
    this.#animations.forEach((animation) => animation.cancel());
    this.#layers = [];
    this.#animations = [];
    this.#busy = false;
  }

  // Blocs de la page qui glissent : en-tête, contenu et pied de page.
  #pageParts() {
    return [...document.querySelectorAll('body > header, #contenu, body > footer')];
  }

  #reveal(parts, delay) {
    parts.forEach((part, index) =>
      this.#play(part, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
        duration: 400,
        delay: delay + index * 70,
        fill: 'backwards',
      }),
    );
  }

  // Calque plein écran qui porte une copie du visuel ; data-overlay bloque l'économiseur d'écran.
  #layer(art) {
    const layer = document.createElement('div');
    layer.className = OVERLAY_CLASSES;
    layer.dataset.overlay = '';
    layer.setAttribute('aria-hidden', 'true');
    const copy = art.cloneNode(true);
    copy.setAttribute('class', 'size-full object-cover');
    layer.append(copy);
    document.body.append(layer);
    this.#layers.push(layer);
    return layer;
  }

  #frame(box, radius) {
    return { top: `${box.top}px`, left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px`, borderRadius: radius };
  }

  #fullScreen() {
    return { top: '0px', left: '0px', width: `${window.innerWidth}px`, height: `${window.innerHeight}px`, borderRadius: '0' };
  }

  #play(element, keyframes, options) {
    const animation = element.animate(keyframes, { easing: EASE, ...options });
    this.#animations.push(animation);
    return animation.finished.catch(() => {});
  }
}
