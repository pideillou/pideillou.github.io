/**
 * Affiche l'heure locale dans l'en-tête.
 */
export default class ClockView {
  #element;

  /** @param {HTMLElement} element Élément [data-clock]. */
  constructor(element) {
    this.#element = element;
  }

  /** @returns {string} Fuseau horaire indiqué dans le HTML (data-timezone). */
  get timeZone() {
    return this.#element.dataset.timezone;
  }

  /** @param {string} time */
  render(time) {
    this.#element.textContent = time;
  }
}
