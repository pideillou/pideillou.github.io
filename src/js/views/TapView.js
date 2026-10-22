// Temps maximal pour enchaîner les tapotements (ms).
const TAP_WINDOW = 2000;

/**
 * Tapotements répétés sur un élément (déclencheur d'easter egg sur mobile, sans clavier).
 */
export default class TapView {
  #element;

  /** @param {HTMLElement} element */
  constructor(element) {
    this.#element = element;
  }

  /**
   * @param {number} count Nombre de tapotements à enchaîner.
   * @param {() => void} handler
   */
  bindTaps(count, handler) {
    let taps = [];
    this.#element.addEventListener('pointerdown', () => {
      const now = Date.now();
      taps = [...taps.filter((time) => now - time < TAP_WINDOW), now];
      if (taps.length < count) return;
      taps = [];
      handler();
    });
  }
}
