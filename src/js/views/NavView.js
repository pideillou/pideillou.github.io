/**
 * Pilule de navigation : menu mobile, lien de la section active
 * et fond qui glisse sous ce lien sur desktop.
 */
export default class NavView {
  #root;
  #toggle;
  #links;
  #indicator;
  #activeLink = null;

  /** @param {HTMLElement} root Conteneur [data-nav]. */
  constructor(root) {
    this.#root = root;
    this.#toggle = root.querySelector('[data-nav-toggle]');
    this.#links = [...root.querySelectorAll('[data-nav-link]')];
    this.#indicator = root.querySelector('[data-nav-indicator]');

    window.addEventListener('resize', () => this.#moveIndicator());
  }

  /** @returns {string[]} Identifiants des sections ciblées par les liens. */
  get sectionIds() {
    return this.#links.map((link) => link.hash.slice(1));
  }

  /**
   * @param {{ open: boolean, activeId: string }} state
   */
  render({ open, activeId }) {
    this.#root.toggleAttribute('data-open', open);
    this.#toggle.setAttribute('aria-expanded', String(open));

    this.#activeLink = this.#links.find((link) => link.hash === `#${activeId}`) ?? null;
    this.#links.forEach((link) => {
      if (link === this.#activeLink) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    this.#root.toggleAttribute('data-active', this.#activeLink !== null);
    this.#moveIndicator();
  }

  /** Remet le focus sur le bouton du menu (après Échap). */
  focusToggle() {
    this.#toggle.focus();
  }

  /** @param {() => void} handler */
  bindToggle(handler) {
    this.#toggle.addEventListener('click', handler);
  }

  /**
   * Fermeture du menu : clic sur un lien ou clic en dehors de la pilule.
   * @param {() => void} handler
   */
  bindClose(handler) {
    this.#root.addEventListener('click', (event) => {
      if (event.target.closest('[data-nav-link]')) handler();
    });
    document.addEventListener('click', (event) => {
      if (!this.#root.contains(event.target)) handler();
    });
  }

  /** @param {() => void} handler */
  bindEscape(handler) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') handler();
    });
  }

  /**
   * Prévient quand une section passe au milieu de l'écran.
   * En bas de page, la dernière section devient active même si elle est trop courte
   * pour atteindre le milieu de l'écran.
   * @param {string[]} ids Sections à observer.
   * @param {(id: string) => void} handler
   */
  observeSections(ids, handler) {
    const isAtBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    window.addEventListener(
      'scroll',
      () => {
        if (isAtBottom()) handler(ids.at(-1));
      },
      { passive: true },
    );

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAtBottom()) {
          handler(ids.at(-1));
          return;
        }
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => handler(entry.target.id));
      },
      { rootMargin: '-45% 0px -55% 0px' },
    );
    ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => observer.observe(section));
  }

  // Position et largeur calculées en JS, passées au CSS par des variables.
  #moveIndicator() {
    if (!this.#activeLink) return;
    this.#indicator.style.setProperty('--indicator-x', `${this.#activeLink.offsetLeft}px`);
    this.#indicator.style.setProperty('--indicator-w', `${this.#activeLink.offsetWidth}px`);
  }
}
