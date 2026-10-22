// Durée du fondu entre deux thèmes (ms), un peu plus longue que la transition CSS.
const TRANSITION = 700;

/**
 * Applique le thème sur <html> (data-theme) et met à jour la couleur de la barre du navigateur.
 */
export default class ThemeView {
  #root = document.documentElement;
  #meta = document.querySelector('meta[name="theme-color"]');
  #timer = 0;

  /**
   * Couleurs du thème actif, lues dans le CSS.
   * @returns {{ name: string, value: string }[]}
   */
  get palette() {
    const style = getComputedStyle(this.#root);
    return ['surface', 'ink', 'muted', 'support', 'accent', 'online'].map((name) => ({
      name,
      value: style.getPropertyValue(`--color-${name}`).trim(),
    }));
  }

  /**
   * @param {{ theme: string }} state
   * @param {{ animate?: boolean }} [options] Fondu entre l'ancien et le nouveau thème.
   */
  render({ theme }, { animate = false } = {}) {
    if (animate) {
      clearTimeout(this.#timer);
      this.#root.toggleAttribute('data-theme-transition', true);
      this.#timer = setTimeout(() => this.#root.toggleAttribute('data-theme-transition', false), TRANSITION);
    }
    if (theme === 'defaut') delete this.#root.dataset.theme;
    else this.#root.dataset.theme = theme;
    this.#meta?.setAttribute('content', getComputedStyle(this.#root).getPropertyValue('--color-surface').trim());
  }

  /**
   * Affiche un thème le temps d'un effet (jackpot), sans l'enregistrer.
   * @param {string} theme
   */
  preview(theme) {
    this.render({ theme }, { animate: true });
  }
}
