import { pickRandom, shuffle } from '../utils/random.js';

// Nombre de symboles qui défilent avant le symbole gagnant.
const STRIP_LENGTH = 35;
// Probabilité d'un jackpot : la même compétence sur tous les rouleaux.
const JACKPOT_CHANCE = 1 / 30;

/**
 * Machine à sous : tire des compétences différentes, une par rouleau,
 * sauf en cas de jackpot où la même compétence sort partout.
 * Émet « spin » avec { reels, result, jackpot } à chaque tirage.
 */
export default class SlotMachineModel extends EventTarget {
  #skills;
  #reelCount;
  #result = [];

  /**
   * @param {string[]} skills Noms des compétences.
   * @param {number} [reelCount=3] Nombre de rouleaux.
   */
  constructor(skills, reelCount = 3) {
    super();
    this.#skills = skills;
    this.#reelCount = reelCount;
  }

  /** @returns {boolean} Vrai s'il y a assez de compétences pour remplir les rouleaux. */
  get canSpin() {
    return this.#skills.length >= this.#reelCount;
  }

  /** @returns {string[]} Compétences tirées au dernier lancer. */
  get result() {
    return this.#result;
  }

  /** @returns {boolean} Vrai si tous les rouleaux affichent la même compétence. */
  get isJackpot() {
    return this.#result.length > 1 && this.#result.every((skill) => skill === this.#result[0]);
  }

  /**
   * Lance un tirage. Chaque bande se termine par le symbole gagnant
   * suivi d'un symbole de plus, visible sous la ligne de gain.
   */
  spin() {
    this.#result = Math.random() < JACKPOT_CHANCE
      ? Array(this.#reelCount).fill(pickRandom(this.#skills))
      : shuffle(this.#skills).slice(0, this.#reelCount);
    const reels = this.#result.map((winner) => [
      ...Array.from({ length: STRIP_LENGTH }, () => pickRandom(this.#skills)),
      winner,
      pickRandom(this.#skills),
    ]);
    this.dispatchEvent(
      new CustomEvent('spin', { detail: { reels, result: this.#result, jackpot: this.isJackpot } }),
    );
  }
}
