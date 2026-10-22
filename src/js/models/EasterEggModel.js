/**
 * Easter egg : une suite de touches secrète active ou désactive un mode.
 * La suite peut être un mot (« dino ») ou une liste de touches (code Konami).
 * Émet « change » avec { active } à chaque bascule.
 */
export default class EasterEggModel extends EventTarget {
  #sequence;
  #typed = [];
  #active = false;

  /** @param {string | string[]} sequence Mot ou touches à taper, en minuscules. */
  constructor(sequence) {
    super();
    this.#sequence = typeof sequence === 'string' ? [...sequence] : sequence;
  }

  /** @returns {boolean} */
  get active() {
    return this.#active;
  }

  /**
   * Ajoute une touche tapée ; bascule le mode quand la suite secrète est complète.
   * @param {string} key Valeur de event.key.
   */
  type(key) {
    this.#typed = [...this.#typed, key.toLowerCase()].slice(-this.#sequence.length);
    if (this.#typed.join(' ') !== this.#sequence.join(' ')) return;

    this.#typed = [];
    this.toggle();
  }

  /** Active ou désactive le mode (aussi depuis le terminal). */
  toggle() {
    this.#active = !this.#active;
    this.dispatchEvent(new CustomEvent('change', { detail: { active: this.#active } }));
  }
}
