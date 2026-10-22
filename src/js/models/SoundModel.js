/**
 * Son du site : le jingle du jackpot est coupé par défaut, choix gardé d'une visite à l'autre.
 * Le rugissement du curseur dino joue tant que le visiteur n'a pas coupé le son lui-même.
 * Émet « change » avec { on } à chaque changement.
 */
export default class SoundModel extends EventTarget {
  #storage;
  // true (son on), false (son off) ou null (le visiteur n'a rien choisi).
  #choice;

  /** @param {import('../services/StorageService.js').default} storage */
  constructor(storage) {
    super();
    this.#storage = storage;
    const saved = storage.load(null);
    this.#choice = typeof saved === 'boolean' ? saved : null;
  }

  /** @returns {boolean} Vrai si le visiteur a activé le son (jingle du jackpot). */
  get on() {
    return this.#choice === true;
  }

  /** @returns {boolean} Vrai si le visiteur a coupé le son avec « son off ». */
  get muted() {
    return this.#choice === false;
  }

  /** @param {boolean} on */
  set(on) {
    this.#choice = on;
    this.#storage.save(on);
    this.dispatchEvent(new CustomEvent('change', { detail: { on } }));
  }
}
