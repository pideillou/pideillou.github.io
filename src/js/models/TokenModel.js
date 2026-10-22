// Jetons pour relancer le tirage : réserve maximale et temps de recharge d'un jeton (ms).
const MAX_TOKENS = 3;
const REFILL_DELAY = 45_000;
// Plafond avec les bonus, qui peuvent dépasser la réserve normale.
const BONUS_CAP = 9;
/** Jetons offerts à chaque jackpot. */
export const JACKPOT_BONUS = 3;

/**
 * Jetons de la machine à sous : une relance coûte un jeton.
 * Ils se rechargent avec le temps jusqu'à la réserve maximale,
 * et des bonus uniques récompensent l'exploration du site.
 * Gardés d'une visite à l'autre. Émet « change » avec l'état, et « earn » avec { reason }.
 */
export default class TokenModel extends EventTarget {
  #storage;
  #tokens;
  #updatedAt;
  #claimed;

  /** @param {import('../services/StorageService.js').default} storage */
  constructor(storage) {
    super();
    this.#storage = storage;
    const saved = storage.load({ tokens: MAX_TOKENS, updatedAt: Date.now(), claimed: [] });
    this.#tokens = Number.isInteger(saved.tokens) ? saved.tokens : MAX_TOKENS;
    this.#updatedAt = Number.isFinite(saved.updatedAt) ? saved.updatedAt : Date.now();
    this.#claimed = new Set(Array.isArray(saved.claimed) ? saved.claimed : []);
    this.#refill();
  }

  /** @returns {{ tokens: number, max: number, nextIn: number }} nextIn en ms, 0 si la réserve est pleine. */
  get state() {
    this.#refill();
    const nextIn = this.#tokens < MAX_TOKENS ? REFILL_DELAY - (Date.now() - this.#updatedAt) : 0;
    return { tokens: this.#tokens, max: MAX_TOKENS, nextIn: Math.max(nextIn, 0) };
  }

  /**
   * @param {string} reason
   * @returns {boolean} Vrai si ce bonus a déjà été gagné.
   */
  hasClaimed(reason) {
    return this.#claimed.has(reason);
  }

  /**
   * Dépense un jeton.
   * @returns {boolean} Faux s'il n'en reste aucun.
   */
  spend() {
    this.#refill();
    if (this.#tokens === 0) return false;
    // La recharge démarre au moment où la réserve n'est plus pleine.
    if (this.#tokens === MAX_TOKENS) this.#updatedAt = Date.now();
    this.#tokens -= 1;
    this.#save();
    return true;
  }

  /**
   * Bonus unique (une seule fois par visiteur) pour une découverte.
   * @param {string} reason Identifiant de la découverte (« lamp », « dino », « profil »…).
   */
  earn(reason) {
    if (this.#claimed.has(reason)) return;
    this.#claimed.add(reason);
    this.#tokens = Math.min(this.#tokens + 1, BONUS_CAP);
    this.#save();
    this.dispatchEvent(new CustomEvent('earn', { detail: { reason } }));
  }

  /**
   * Offre des jetons (jackpot), dans la limite du plafond des bonus.
   * @param {number} amount
   */
  grant(amount) {
    this.#refill();
    this.#tokens = Math.min(this.#tokens + amount, BONUS_CAP);
    this.#save();
  }

  // Ajoute les jetons rechargés depuis la dernière mise à jour.
  #refill() {
    if (this.#tokens >= MAX_TOKENS) return;
    const gained = Math.floor((Date.now() - this.#updatedAt) / REFILL_DELAY);
    if (gained === 0) return;
    this.#tokens = Math.min(this.#tokens + gained, MAX_TOKENS);
    this.#updatedAt += gained * REFILL_DELAY;
    this.#save();
  }

  #save() {
    this.#storage.save({ tokens: this.#tokens, updatedAt: this.#updatedAt, claimed: [...this.#claimed] });
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
