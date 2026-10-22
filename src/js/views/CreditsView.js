// Déroulé du générique (ms).
const INTRO_DURATION = 5000;
const LOGO_START = 5500;
const LOGO_DURATION = 8000;
const CRAWL_START = 8000;
// Vitesse du texte qui défile vers le fond (pixels par seconde, avant perspective).
const CRAWL_SPEED = 38;
const STARS = 220;

// Classes complètes (jamais construites dynamiquement).
const ROOT_CLASSES = 'fixed inset-0 z-50 cursor-pointer overflow-hidden bg-space';
const STARS_CLASSES = 'absolute inset-0 size-full';
const INTRO_CLASSES =
  'absolute inset-0 m-auto flex h-fit max-w-xl items-center px-6 text-left font-sans text-xl leading-snug text-crawl-intro opacity-0 sm:text-3xl';
const LOGO_CLASSES =
  'absolute inset-0 m-auto flex h-fit items-center justify-center px-4 text-center font-display text-hero font-bold text-crawl uppercase opacity-0';
// La scène inclinée : le texte part du bas et s'enfonce vers l'horizon.
const STAGE_CLASSES = 'absolute inset-0 flex justify-center perspective-[22rem]';
const PLANE_CLASSES = 'h-full w-full max-w-2xl origin-bottom rotate-x-[24deg] overflow-visible px-6';
const CRAWL_CLASSES = 'flex flex-col gap-8 font-sans text-lg font-bold text-crawl sm:text-3xl';
const EPISODE_CLASSES = 'text-center uppercase';
const SUBTITLE_CLASSES = 'text-center text-2xl uppercase sm:text-5xl';
const PARAGRAPH_CLASSES = 'text-justify leading-relaxed hyphens-auto';
const ROLE_CLASSES = 'text-center text-base tracking-widest uppercase sm:text-xl';
const NAMES_CLASSES = 'text-center';
const END_CLASSES = 'pt-8 text-center text-4xl uppercase sm:text-6xl';
const THANKS_CLASSES = 'pt-8 text-center text-2xl uppercase sm:text-5xl';
// Le texte s'efface en haut, vers l'horizon.
const FADE_CLASSES = 'pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-space to-transparent';
const HINT_CLASSES = 'absolute right-4 bottom-4 font-mono text-xs text-muted';

/**
 * @param {string} tag
 * @param {string} className
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function create(tag, className, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

/**
 * Générique façon « space opera » : phrase d'introduction, titre qui s'éloigne dans les étoiles,
 * puis texte jaune qui défile en perspective. Un clic ou Échap l'arrête.
 */
export default class CreditsView {
  /**
   * @param {{ intro: string, logo: string, episode: string, subtitle: string, crawl: string[],
   *   roles: { role: string, names: string[] }[], thanks: string, stats: { role: string, names: string[] }[],
   *   ending: string }} credits stats : scores du visiteur, après les remerciements.
   * @returns {Promise<boolean>} Vrai si le générique a été vu jusqu'au bout.
   */
  play({ intro, logo, episode, subtitle, crawl, roles, thanks, stats = [], ending }) {
    return new Promise((resolve) => {
      const root = create('div', ROOT_CLASSES);
      root.dataset.overlay = '';
      const stars = create('canvas', STARS_CLASSES);
      stars.setAttribute('aria-hidden', 'true');
      const introText = create('p', INTRO_CLASSES, intro);
      const logoText = create('p', LOGO_CLASSES, logo);

      const stage = create('div', STAGE_CLASSES);
      const plane = create('div', PLANE_CLASSES);
      const text = create('div', CRAWL_CLASSES);
      text.append(create('p', EPISODE_CLASSES, episode), create('p', SUBTITLE_CLASSES, subtitle));
      crawl.forEach((paragraph) => text.append(create('p', PARAGRAPH_CLASSES, paragraph)));
      const appendRoles = (list) =>
        list.forEach(({ role, names }) => {
          text.append(create('p', ROLE_CLASSES, role), create('p', NAMES_CLASSES, names.join(' · ')));
        });
      appendRoles(roles);
      // Fin de partie : remerciements, puis les scores du visiteur.
      if (thanks) text.append(create('p', THANKS_CLASSES, thanks));
      appendRoles(stats);
      text.append(create('p', PARAGRAPH_CLASSES, ending), create('p', END_CLASSES, 'Fin'));
      plane.append(text);
      stage.append(plane);

      root.append(stars, introText, logoText, stage, create('div', FADE_CLASSES), create('p', HINT_CLASSES, 'Échap ou clic pour quitter'));
      document.body.append(root);
      this.#drawStars(stars);

      const animations = [];
      // 1. La phrase d'introduction apparaît puis s'efface.
      animations.push(
        introText.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
          duration: INTRO_DURATION,
        }),
      );
      // 2. Le titre surgit en grand puis s'éloigne dans l'espace.
      animations.push(
        logoText.animate(
          [
            { transform: 'scale(2.6)', opacity: 1 },
            { transform: 'scale(0.05)', opacity: 1, offset: 0.9 },
            { transform: 'scale(0)', opacity: 0 },
          ],
          // fill « forwards » : avant son départ, le titre reste invisible (classe opacity-0).
          { duration: LOGO_DURATION, delay: LOGO_START, easing: 'ease-in', fill: 'forwards' },
        ),
      );
      // 3. Le texte part du bas de l'écran et s'enfonce jusqu'à disparaître à l'horizon.
      const height = window.innerHeight;
      const distance = height + text.offsetHeight * 1.6;
      const crawlAnimation = text.animate(
        [{ transform: `translateY(${height}px)` }, { transform: `translateY(${height - distance}px)` }],
        { duration: (distance / CRAWL_SPEED) * 1000, delay: CRAWL_START, easing: 'linear', fill: 'both' },
      );
      animations.push(crawlAnimation);

      const close = (complete) => {
        document.removeEventListener('keydown', onKey);
        animations.forEach((animation) => animation.cancel());
        root.remove();
        resolve(complete);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') close(false);
      };
      document.addEventListener('keydown', onKey);
      root.addEventListener('click', () => close(false));
      crawlAnimation.finished.then(() => close(true)).catch(() => {});
    });
  }

  /**
   * Ciel étoilé fixe, dessiné une fois.
   * @param {HTMLCanvasElement} canvas
   */
  #drawStars(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.fillStyle = '#ffffff';
    for (let index = 0; index < STARS; index += 1) {
      context.globalAlpha = 0.3 + Math.random() * 0.7;
      context.beginPath();
      context.arc(Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() * 1.2 + 0.2, 0, Math.PI * 2);
      context.fill();
    }
  }
}
