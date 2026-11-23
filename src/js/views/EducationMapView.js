/**
 * Carte du parcours (src/js/render/educationSection.js). Quand elle a trop d'étapes pour l'écran
 * (téléphone, plus de 6 étapes), elle défile en largeur : on la cale pour montrer le niveau en cours au centre.
 */
export default class EducationMapView {
  #root;

  /** @param {HTMLElement} root Carte [data-education-map]. */
  constructor(root) {
    this.#root = root;
  }

  /** Centre le niveau en cours. Sans effet si toutes les étapes tiennent à l'écran. */
  showCurrent() {
    const current = this.#root.querySelector('[data-current]');
    const overflow = this.#root.scrollWidth - this.#root.clientWidth;
    if (!current || overflow <= 0) return;
    // scrollLeft plutôt que scrollIntoView, qui ferait aussi défiler toute la page jusqu'à la carte.
    const center = current.offsetLeft + current.offsetWidth / 2 - this.#root.clientWidth / 2;
    this.#root.scrollLeft = Math.min(Math.max(center, 0), overflow);
  }
}
