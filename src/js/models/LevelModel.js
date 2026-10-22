/**
 * Fiches projet lues jusqu'au bout, comme les niveaux finis d'une partie.
 * Gardées d'une visite à l'autre. Seules les fiches qui existent encore comptent :
 * un projet retiré du JSON ne fausse pas le compte.
 */
export default class LevelModel {
  #storage;
  #slugs;
  #done;

  /**
   * @param {import('../services/StorageService.js').default} storage
   * @param {string[]} slugs Identifiants de toutes les fiches projet.
   */
  constructor(storage, slugs) {
    this.#storage = storage;
    this.#slugs = slugs;
    const saved = storage.load([]);
    this.#done = new Set(Array.isArray(saved) ? saved : []);
  }

  /** @returns {{ count: number, total: number, complete: boolean }} complete : toutes les fiches lues. */
  get state() {
    const count = this.#slugs.filter((slug) => this.#done.has(slug)).length;
    const total = this.#slugs.length;
    return { count, total, complete: total > 0 && count === total };
  }

  /** @param {string} slug */
  isDone(slug) {
    return this.#done.has(slug);
  }

  /**
   * Marque une fiche comme lue jusqu'au bout.
   * @param {string} slug
   * @returns {boolean} Vrai si elle ne l'avait jamais été.
   */
  finish(slug) {
    if (this.#done.has(slug)) return false;
    this.#done.add(slug);
    this.#storage.save([...this.#done]);
    return true;
  }
}
