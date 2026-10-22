/**
 * Mini-carte (grands écrans) : un losange par section, reliés comme les niveaux d'un jeu.
 * Les sections déjà passées se colorent et le dino avance jusqu'à la section visible.
 * Raccourci pour la souris uniquement : la navigation principale reste la référence au clavier
 * et pour les lecteurs d'écran (la carte leur est masquée).
 * Les positions sont passées au CSS par des variables (--map-progress, --map-dino).
 */
export default class MiniMapView {
  #root;
  #links;

  /** @param {HTMLElement} root Conteneur [data-minimap]. */
  constructor(root) {
    this.#root = root;
    this.#links = [...root.querySelectorAll('[data-minimap-link]')];
  }

  /** @param {{ activeId: string }} state Section visible. */
  render({ activeId }) {
    const index = Math.max(
      this.#links.findIndex((link) => link.hash === `#${activeId}`),
      0,
    );
    this.#links.forEach((link, i) => {
      link.toggleAttribute('data-reached', i <= index);
      link.toggleAttribute('data-current', i === index);
    });
    const center = (link) => link.offsetTop + link.offsetHeight / 2;
    this.#root.style.setProperty('--map-progress', `${center(this.#links[index]) - center(this.#links[0])}px`);
    this.#root.style.setProperty('--map-dino', `${center(this.#links[index])}px`);
  }
}
