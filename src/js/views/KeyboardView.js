/**
 * Touches tapées sur la page, hors des champs de saisie : sert aux codes secrets
 * (« dino », code Konami).
 */
export default class KeyboardView {
  /**
   * @param {(key: string) => void} handler Reçoit event.key (ex. « d », « ArrowUp »).
   */
  bindKeys(handler) {
    document.addEventListener('keydown', (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      if (event.ctrlKey || event.metaKey || event.altKey || target.isContentEditable) return;
      if (target.closest('input, textarea, select')) return;
      handler(event.key);
    });
  }
}
