import { formatTime } from '../utils/formatTime.js';

// Fréquence de mise à jour de l'horloge (ms).
const TICK = 15_000;

/**
 * Met à jour l'heure locale affichée dans l'en-tête.
 */
export default class ClockController {
  /** @param {import('../views/ClockView.js').default} view */
  constructor(view) {
    const tick = () => view.render(formatTime(new Date(), view.timeZone));
    tick();
    setInterval(tick, TICK);
  }
}
