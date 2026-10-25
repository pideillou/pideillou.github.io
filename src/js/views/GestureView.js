// Distance minimale d'un glissé au doigt (px), et seuils d'un simple tapotement.
const SWIPE = 40;
const TAP_DISTANCE = 10;
const TAP_DURATION = 300;
// Zones où le doigt sert déjà à autre chose : champs de saisie, terminal, jeux.
const IGNORED = 'input, textarea, select, canvas, [data-terminal]';

/**
 * Gestes au doigt sur la page : la version tactile des codes secrets (code Konami).
 * Un glissé donne une flèche (« arrowup »…), comme au clavier ; un tapotement donne « tap ».
 * La page défile normalement : on observe le geste sans le bloquer.
 */
export default class GestureView {
  /**
   * @param {(gesture: string) => void} handler Reçoit « arrowup », « arrowdown », « arrowleft », « arrowright » ou « tap ».
   */
  bindGestures(handler) {
    let start = null;
    document.addEventListener(
      'touchstart',
      (event) => {
        const touch = event.touches[0];
        const target = /** @type {Element} */ (event.target);
        start = event.touches.length === 1 && !target.closest(IGNORED) ? { x: touch.clientX, y: touch.clientY, time: event.timeStamp } : null;
      },
      { passive: true },
    );
    document.addEventListener(
      'touchend',
      (event) => {
        if (!start) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const duration = event.timeStamp - start.time;
        start = null;
        if (distance >= SWIPE) {
          handler(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'arrowright' : 'arrowleft') : dy > 0 ? 'arrowdown' : 'arrowup');
        } else if (distance <= TAP_DISTANCE && duration <= TAP_DURATION) {
          handler('tap');
        }
      },
      { passive: true },
    );
  }
}
