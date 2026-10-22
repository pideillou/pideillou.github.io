// Durées des effets (ms).
const GLITCH_DURATION = 1500;
const MATRIX_DURATION = 5000;
// Caractères de la pluie « matrix » : katakana, chiffres et un peu de code.
const MATRIX_GLYPHS = [...'アイウエオカキクケコサシスセソタチツテト0123456789<>/{}=;'];
const MATRIX_FONT_SIZE = 16;

/**
 * Effets visuels déclenchés par des commandes du terminal.
 * Ils ne se jouent pas si l'utilisateur a demandé moins d'animations.
 */
export default class EffectsView {
  #reducedMotion;

  /** @param {{ reducedMotion: boolean }} options */
  constructor({ reducedMotion }) {
    this.#reducedMotion = reducedMotion;
  }

  /** @returns {boolean} Vrai si les effets peuvent se jouer. */
  get enabled() {
    return !this.#reducedMotion;
  }

  /** La page tremble et change de couleurs un instant. */
  glitch() {
    if (!this.enabled) return;
    const root = document.documentElement;
    root.toggleAttribute('data-glitch', true);
    setTimeout(() => root.toggleAttribute('data-glitch', false), GLITCH_DURATION);
  }

  /** Pluie de caractères verts sur tout l'écran pendant quelques secondes. */
  matrix() {
    if (!this.enabled) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'pointer-events-none fixed inset-0 z-50 size-full';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.overlay = '';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.append(canvas);

    const context = canvas.getContext('2d');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-online').trim();
    const drops = Array.from({ length: Math.ceil(canvas.width / MATRIX_FONT_SIZE) }, () => Math.random() * -50);
    const start = performance.now();

    const frame = (now) => {
      // Voile sombre à chaque image : les anciens caractères s'estompent.
      context.fillStyle = 'rgb(0 0 0 / 0.08)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      context.font = `${MATRIX_FONT_SIZE}px monospace`;
      drops.forEach((y, column) => {
        const glyph = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
        context.fillText(glyph, column * MATRIX_FONT_SIZE, y * MATRIX_FONT_SIZE);
        drops[column] = y * MATRIX_FONT_SIZE > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
      });

      if (now - start < MATRIX_DURATION) {
        requestAnimationFrame(frame);
        return;
      }
      canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 }).finished.then(() => canvas.remove());
    };
    requestAnimationFrame(frame);
  }
}
