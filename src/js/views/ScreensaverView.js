// Vitesse du logo (pixels par seconde).
const SPEED = 140;
// Couleurs prises à chaque rebond (classes complètes, jamais construites dynamiquement).
const COLORS = ['bg-accent', 'bg-online', 'bg-support', 'bg-gold', 'bg-ink'];
const ROOT_CLASSES = 'fixed inset-0 z-50 cursor-none bg-surface/95';
const LOGO_CLASSES =
  'absolute top-0 left-0 flex size-24 items-center justify-center rounded-full font-display text-3xl text-surface italic shadow-2xl';
// Événements qui réveillent la page.
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];

/**
 * Économiseur d'écran : après un moment sans activité, le logo « Pp » rebondit
 * sur les bords comme le vieux logo DVD. Le moindre mouvement le fait disparaître.
 */
export default class ScreensaverView {
  #root = null;
  #frame = 0;
  #timer = 0;

  /**
   * @param {number} delay Temps sans activité avant le lancement (ms).
   * @param {{ onStart: () => void, onCorner: () => void }} handlers
   */
  bindIdle(delay, { onStart, onCorner }) {
    const reset = () => {
      if (this.#root) this.#stop();
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => {
        // Pas d'économiseur si un autre effet occupe l'écran (jackpot, générique, chargement…).
        if (document.querySelector('[data-overlay], dialog[open]')) return reset();
        this.#start(onCorner);
        onStart();
      }, delay);
    };
    ACTIVITY.forEach((type) => window.addEventListener(type, reset, { passive: true }));
    reset();
  }

  /** @param {() => void} onCorner */
  #start(onCorner) {
    const root = document.createElement('div');
    root.className = ROOT_CLASSES;
    root.setAttribute('aria-hidden', 'true');
    const logo = document.createElement('div');
    logo.textContent = 'Pp';
    root.append(logo);
    document.body.append(root);
    this.#root = root;

    let color = 0;
    const paint = () => {
      logo.className = `${LOGO_CLASSES} ${COLORS[color % COLORS.length]}`;
    };
    paint();

    const size = logo.offsetWidth;
    let x = Math.random() * (window.innerWidth - size);
    let y = Math.random() * (window.innerHeight - size);
    let dx = 1;
    let dy = 1;
    let last = performance.now();

    const tick = (now) => {
      const move = (SPEED * (now - last)) / 1000;
      last = now;
      x += dx * move;
      y += dy * move;
      const maxX = window.innerWidth - size;
      const maxY = window.innerHeight - size;
      const hitX = x <= 0 || x >= maxX;
      const hitY = y <= 0 || y >= maxY;
      if (hitX) dx = x <= 0 ? 1 : -1;
      if (hitY) dy = y <= 0 ? 1 : -1;
      x = Math.min(Math.max(x, 0), maxX);
      y = Math.min(Math.max(y, 0), maxY);
      if (hitX || hitY) {
        color += 1;
        paint();
      }
      // Le moment que tout le monde attend : le logo touche un coin pile.
      if (hitX && hitY) onCorner();
      // Position calculée en JS : seule exception admise aux styles en ligne.
      logo.style.transform = `translate(${x}px, ${y}px)`;
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #stop() {
    cancelAnimationFrame(this.#frame);
    this.#root.remove();
    this.#root = null;
  }
}
