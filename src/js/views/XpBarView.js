// Durée d'affichage du message « Niveau terminé » (ms).
const TOAST_TIME = 5000;

// data-idle : page trop courte pour défiler, la barre n'a rien à montrer.
const BAR_CLASSES = 'pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-muted/15 data-idle:hidden';
const FILL_CLASSES = 'absolute inset-0 origin-left scale-x-(--xp) bg-accent motion-safe:transition-transform motion-safe:duration-150';
// Encoche au début de chaque section, comme les paliers d'une barre d'expérience.
const TICK_CLASSES = 'absolute inset-y-0 left-(--tick) w-0.5 bg-surface';
const TOAST_CLASSES =
  'pointer-events-none fixed right-4 bottom-4 left-4 z-50 w-fit rounded-2xl border border-accent bg-surface px-4 py-2 font-mono text-xs text-accent shadow-2xl empty:hidden';

/**
 * @typedef {object} LevelUp
 * @property {number} gained Jetons gagnés à l'instant.
 * @property {{ isNew: boolean, count: number, total: number, cleared: boolean, next: string | null } | null} level
 *   Avancée dans les fiches projet (null hors des fiches). cleared : la dernière fiche vient d'être finie.
 *   next : titre du projet suivant, s'il reste à lire.
 */

/**
 * Barre d'XP en haut de l'écran : elle se remplit pendant la lecture de la page.
 * Décorative pour les lecteurs d'écran ; seul le message de fin est annoncé.
 */
export default class XpBarView {
  #bar;
  #fill;
  #ticks;
  #toast;
  #reducedMotion;

  /** @param {{ reducedMotion: boolean }} options */
  constructor({ reducedMotion }) {
    this.#reducedMotion = reducedMotion;
    this.#bar = document.createElement('div');
    this.#bar.className = BAR_CLASSES;
    this.#bar.setAttribute('aria-hidden', 'true');
    this.#fill = document.createElement('div');
    this.#fill.className = FILL_CLASSES;
    this.#ticks = document.createElement('div');
    this.#bar.append(this.#fill, this.#ticks);

    // Zone annoncée aux lecteurs d'écran, présente dès le départ pour être lue quand elle change.
    this.#toast = document.createElement('p');
    this.#toast.className = TOAST_CLASSES;
    this.#toast.setAttribute('role', 'status');
    document.body.append(this.#bar, this.#toast);

    // La hauteur de la page change (contenu ajouté par le JS, images, fenêtre) : on replace les encoches.
    new ResizeObserver(() => this.#placeTicks()).observe(document.body);
  }

  /** @param {{ progress: number }} state */
  render({ progress }) {
    this.#bar.toggleAttribute('data-idle', this.#scrollable() <= 0);
    // Valeur calculée en JS, passée au CSS par une variable.
    this.#bar.style.setProperty('--xp', String(progress));
  }

  /**
   * Message de fin de lecture, quelques secondes.
   * @param {LevelUp} result
   */
  levelUp(result) {
    this.#toast.textContent = this.#message(result);
    if (!this.#reducedMotion) {
      this.#toast.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 250 });
    }
    setTimeout(() => {
      this.#toast.textContent = '';
    }, TOAST_TIME);
  }

  /**
   * Défilement de la page, une mise à jour par image affichée.
   * @param {(progress: number) => void} handler Part de la page parcourue, entre 0 et 1.
   */
  bindScroll(handler) {
    let pending = false;
    const update = () => {
      pending = false;
      const scrollable = this.#scrollable();
      handler(scrollable > 0 ? window.scrollY / scrollable : 0);
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }

  /**
   * Sur une fiche projet, le message dit où en est la partie et donne envie de lire la suite.
   * @param {LevelUp} result
   */
  #message({ gained, level }) {
    const bonus = gained ? ` · +${gained} jeton${gained > 1 ? 's' : ''}` : '';
    if (!level) return `✦ Niveau terminé : page lue jusqu’au bout${bonus}`;

    const { isNew, count, total, cleared, next } = level;
    const left = total - count;
    const remaining = `encore ${left} fiche${left > 1 ? 's' : ''} à lire`;
    if (cleared) return `★ Partie terminée : les ${total} projets lus jusqu’au bout${bonus}`;
    if (!isNew && left === 0) return `↺ Niveau rejoué · partie déjà finie (${total}/${total})${bonus}`;
    if (!isNew) return `↺ Niveau déjà fini · ${remaining}${bonus}`;
    return `✦ Niveau ${count}/${total} terminé · ${next ? `prochain : ${next}` : remaining}${bonus}`;
  }

  #scrollable() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  #placeTicks() {
    const scrollable = this.#scrollable();
    const ticks = [...document.querySelectorAll('main section[id]')]
      .map((section) => section.getBoundingClientRect().top + window.scrollY)
      .filter((top) => top > 0 && top < scrollable)
      .map((top) => {
        const tick = document.createElement('span');
        tick.className = TICK_CLASSES;
        tick.style.setProperty('--tick', `${(top / scrollable) * 100}%`);
        return tick;
      });
    this.#ticks.replaceChildren(...ticks);
  }
}
