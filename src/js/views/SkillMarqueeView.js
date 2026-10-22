const SVG_NS = 'http://www.w3.org/2000/svg';

const ITEM_CLASSES = 'flex shrink-0 items-center gap-3 px-6 py-3 text-muted';
const LOGO_CLASSES = 'size-8 shrink-0 fill-current';
// Logo absent : une pastille avec l'initiale de la compétence.
const INITIAL_CLASSES =
  'flex size-8 shrink-0 items-center justify-center rounded-full border border-current font-mono text-sm';

/**
 * Bandeau des outils maîtrisés qui défile en continu.
 * Le défilement doit pouvoir s'arrêter (RGAA 13.8, WCAG 2.2.2) : au survol de la souris,
 * au focus clavier (CSS), et d'un toucher sur écran tactile (un second le relance).
 * Sans animation (prefers-reduced-motion), le bandeau devient une liste fixe.
 */
export default class SkillMarqueeView {
  #lists;

  /** @param {HTMLElement} root Section des outils. */
  constructor(root) {
    this.#lists = [...root.querySelectorAll('[data-marquee-list]')];
    const viewport = root.querySelector('[data-marquee-viewport]');
    let pointerType = 'mouse';
    viewport.addEventListener('pointerdown', (event) => {
      pointerType = event.pointerType;
    });
    viewport.addEventListener('click', () => {
      if (pointerType !== 'mouse') root.toggleAttribute('data-paused');
    });
  }

  /**
   * Crée les deux copies du bandeau : la seconde, masquée aux lecteurs d'écran,
   * prend le relais de la première pour une boucle sans à-coup.
   * @param {{ name: string, logo?: string }[]} skills
   */
  render(skills) {
    this.#lists.forEach((list) => list.replaceChildren(...skills.map((skill) => this.#item(skill))));
  }

  #item({ name, logo }) {
    const item = document.createElement('li');
    item.className = ITEM_CLASSES;

    let icon;
    if (logo) {
      icon = document.createElementNS(SVG_NS, 'svg');
      icon.setAttribute('class', LOGO_CLASSES);
      icon.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(SVG_NS, 'use');
      use.setAttribute('href', `#logo-${logo}`);
      icon.append(use);
    } else {
      icon = document.createElement('span');
      icon.className = INITIAL_CLASSES;
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = name.charAt(0);
    }

    const label = document.createElement('span');
    label.className = 'font-mono text-sm tracking-wider whitespace-nowrap uppercase';
    label.textContent = name;

    item.append(icon, label);
    return item;
  }
}
