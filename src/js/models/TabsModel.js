/**
 * Onglet sélectionné parmi une liste (menu pause du profil).
 * Émet « change » avec { selected } à chaque changement.
 */
export default class TabsModel extends EventTarget {
  #ids;
  #selected;

  /** @param {string[]} ids Identifiants des onglets, dans l'ordre. */
  constructor(ids) {
    super();
    this.#ids = ids;
    this.#selected = ids[0];
  }

  /** @returns {{ selected: string }} */
  get state() {
    return { selected: this.#selected };
  }

  /** @param {string} id */
  select(id) {
    if (!this.#ids.includes(id) || id === this.#selected) return;
    this.#selected = id;
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }

  /** Onglet suivant (on revient au premier après le dernier). */
  next() {
    this.#step(1);
  }

  /** Onglet précédent (on passe au dernier avant le premier). */
  previous() {
    this.#step(-1);
  }

  first() {
    this.select(this.#ids[0]);
  }

  last() {
    this.select(this.#ids.at(-1));
  }

  #step(step) {
    const index = this.#ids.indexOf(this.#selected);
    this.select(this.#ids[(index + step + this.#ids.length) % this.#ids.length]);
  }
}
