/**
 * Collection des compétences découvertes au fil des tirages, gardée d'une visite à l'autre.
 * Deux récompenses : toutes les compétences vues, et au moins un jackpot.
 * Émet « change » avec l'état complet à chaque tirage.
 */
export default class CollectionModel extends EventTarget {
  #skills;
  #storage;
  #found;
  #jackpot;

  /**
   * @param {string[]} skills Toutes les compétences à collectionner.
   * @param {import('../services/StorageService.js').default} storage
   */
  constructor(skills, storage) {
    super();
    this.#skills = skills;
    this.#storage = storage;

    const saved = storage.load({ found: [], jackpot: false });
    // On ignore les compétences retirées du JSON depuis la dernière visite.
    this.#found = new Set(saved.found.filter((name) => skills.includes(name)));
    this.#jackpot = saved.jackpot === true;
  }

  /**
   * @returns {{ skills: { name: string, found: boolean }[], found: number, total: number,
   *   complete: boolean, jackpot: boolean }}
   */
  get state() {
    return {
      skills: this.#skills.map((name) => ({ name, found: this.#found.has(name) })),
      found: this.#found.size,
      total: this.#skills.length,
      complete: this.#found.size === this.#skills.length,
      jackpot: this.#jackpot,
    };
  }

  /**
   * Ajoute les compétences d'un tirage.
   * @param {string[]} result
   * @param {boolean} jackpot
   */
  add(result, jackpot) {
    result.forEach((name) => this.#found.add(name));
    this.#jackpot ||= jackpot;
    this.#storage.save({ found: [...this.#found], jackpot: this.#jackpot });
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
