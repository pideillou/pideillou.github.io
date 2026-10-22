// Images par seconde du timecode, comme en vidéo PAL.
const FPS = 25;

// Classes complètes du badge (jamais construites dynamiquement).
const BADGE_CLASSES =
  'pointer-events-none fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-md border border-accent/60 bg-surface/90 px-3 py-1.5 font-mono text-xs text-ink tabular-nums backdrop-blur-sm';
const DOT_CLASSES = 'size-2.5 rounded-full bg-accent motion-safe:animate-blink';

/**
 * Faux enregistrement vidéo : badge « ● REC » avec un timecode qui tourne (HH:MM:SS:II).
 */
export default class RecView {
  #badge = null;
  #frame = 0;

  /** @returns {boolean} */
  get isRecording() {
    return this.#badge !== null;
  }

  /** Lance ou arrête l'enregistrement. */
  toggle() {
    if (this.#badge) {
      cancelAnimationFrame(this.#frame);
      this.#badge.remove();
      this.#badge = null;
      return;
    }

    const badge = document.createElement('p');
    badge.className = BADGE_CLASSES;
    badge.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('span');
    dot.className = DOT_CLASSES;
    const time = document.createElement('span');
    badge.append(dot, 'REC', time);
    document.body.append(badge);
    this.#badge = badge;

    const start = performance.now();
    const tick = (now) => {
      const frames = Math.floor(((now - start) / 1000) * FPS);
      const pad = (value) => String(value).padStart(2, '0');
      const seconds = Math.floor(frames / FPS);
      time.textContent = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}:${pad(frames % FPS)}`;
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }
}
