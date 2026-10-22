/**
 * Sommaire d'une fiche projet : met en avant la partie en cours de lecture.
 */
export default class TocView {
  #links;

  /** @param {HTMLElement} root Conteneur [data-toc]. */
  constructor(root) {
    this.#links = [...root.querySelectorAll('a[href^="#"]')];
  }

  /** @returns {string[]} Identifiants des parties ciblées par le sommaire. */
  get sectionIds() {
    return this.#links.map((link) => link.hash.slice(1));
  }

  /** @param {{ activeId: string }} state */
  render({ activeId }) {
    this.#links.forEach((link) => {
      if (link.hash === `#${activeId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  /**
   * Prévient quand une partie passe dans le tiers haut de l'écran.
   * @param {string[]} ids
   * @param {(id: string) => void} handler
   */
  observeSections(ids, handler) {
    const observer = new IntersectionObserver(
      (entries) => entries.filter((entry) => entry.isIntersecting).forEach((entry) => handler(entry.target.id)),
      { rootMargin: '-25% 0px -65% 0px' },
    );
    ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => observer.observe(section));
  }
}
