/**
 * Record du jeu du dino, gardé d'une visite à l'autre.
 */
export default class GameScoreModel {
  #storage;
  #best;

  /** @param {import('../services/StorageService.js').default} storage */
  constructor(storage) {
    this.#storage = storage;
    const saved = storage.load(0);
    this.#best = Number.isFinite(saved) ? saved : 0;
  }

  /** @returns {number} */
  get best() {
    return this.#best;
  }

  /**
   * Enregistre une partie.
   * @param {number} score
   * @returns {{ best: number, isRecord: boolean }}
   */
  record(score) {
    const isRecord = score > this.#best;
    if (isRecord) {
      this.#best = score;
      this.#storage.save(score);
    }
    return { best: this.#best, isRecord };
  }
}
