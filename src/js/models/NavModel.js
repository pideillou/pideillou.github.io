/**
 * État de la navigation : menu mobile ouvert ou fermé, section visible à l'écran.
 * Émet « change » avec { open, activeId } à chaque modification.
 */
export default class NavModel extends EventTarget {
  #open = false;
  #activeId = '';

  /** @returns {boolean} */
  get isOpen() {
    return this.#open;
  }

  /** @returns {{ open: boolean, activeId: string }} */
  get state() {
    return { open: this.#open, activeId: this.#activeId };
  }

  /** Ouvre ou ferme le menu mobile. */
  toggle() {
    this.#open = !this.#open;
    this.#emit();
  }

  /** Ferme le menu mobile s'il est ouvert. */
  close() {
    if (!this.#open) return;
    this.#open = false;
    this.#emit();
  }

  /**
   * @param {string} id Identifiant de la section visible.
   */
  setActive(id) {
    if (id === this.#activeId) return;
    this.#activeId = id;
    this.#emit();
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
