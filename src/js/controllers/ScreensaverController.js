// Temps sans activité avant l'économiseur d'écran (ms).
const IDLE_DELAY = 180_000;

/**
 * Économiseur d'écran : se lance après trois minutes sans activité.
 * Avec moins d'animations, il s'affiche quand même, logo immobile (voir ScreensaverView).
 */
export default class ScreensaverController {
  /**
   * @param {import('../views/ScreensaverView.js').default} view
   * @param {{ onStart: () => void, onCorner: () => void }} options
   */
  constructor(view, { onStart, onCorner }) {
    view.bindIdle(IDLE_DELAY, { onStart, onCorner });
  }
}
