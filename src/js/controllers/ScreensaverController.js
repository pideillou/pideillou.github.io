// Temps sans activité avant l'économiseur d'écran (ms).
const IDLE_DELAY = 180_000;

/**
 * Économiseur d'écran : se lance après trois minutes sans activité.
 * Désactivé si l'utilisateur a demandé moins d'animations.
 */
export default class ScreensaverController {
  /**
   * @param {import('../views/ScreensaverView.js').default} view
   * @param {{ reducedMotion: boolean, onStart: () => void, onCorner: () => void }} options
   */
  constructor(view, { reducedMotion, onStart, onCorner }) {
    if (reducedMotion) return;
    view.bindIdle(IDLE_DELAY, { onStart, onCorner });
  }
}
