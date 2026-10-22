/**
 * Lampe qui révèle les coulisses : allumée ou éteinte, choix gardé d'une visite à l'autre.
 * Éteinte par défaut, pour garder un fond sobre.
 * Émet « change » avec { on } à chaque bascule.
 */
export default class LampModel extends EventTarget {
  #storage;
  #on;

  /** @param {import('../services/StorageService.js').default} storage */
  constructor(storage) {
    super();
    this.#storage = storage;
    this.#on = storage.load(false) === true;
  }

  /** @returns {{ on: boolean }} */
  get state() {
    return { on: this.#on };
  }

  /** Allume ou éteint la lampe. */
  toggle() {
    this.#on = !this.#on;
    this.#storage.save(this.#on);
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
