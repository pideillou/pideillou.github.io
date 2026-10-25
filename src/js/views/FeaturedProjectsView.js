import { createCover, projectUrl } from './projectParts.js';

// Titre de la section ; il change quand la machine à sous fait jackpot.
const HEADINGS = {
  default: ['Trois projets,', 'trois façons de créer.'],
  jackpot: ['Jackpot :', 'trois projets en prime.'],
};
const COVER_SIZES = '(min-width: 768px) 60vw, 100vw';
// Part visible d'une carte avant qu'elle se retourne, et petit suspense avant le geste (ms).
const FLIP_THRESHOLD = 0.35;
const FLIP_DELAY = 150;

/**
 * Section « Projets choisis » : les trois projets tirés par la machine à sous,
 * en grandes cartes qui alternent image à gauche et image à droite.
 * Après un tirage, chaque carte arrive face cachée et se retourne quand elle entre à l'écran,
 * comme une main distribuée. Sans animation (prefers-reduced-motion), elles sont déjà retournées.
 */
export default class FeaturedProjectsView {
  #lines;
  #status;
  #list;
  #template;
  #waitForPage;
  #observer = null;
  #dealing = false;

  /**
   * @param {HTMLElement} root Section #projets.
   * @param {{ reducedMotion: boolean, waitForPage: () => Promise<void> }} options
   *   waitForPage : résolue quand la machine à sous est fermée et la page visible.
   */
  constructor(root, { reducedMotion, waitForPage }) {
    this.#lines = [root.querySelector('[data-featured-line="1"]'), root.querySelector('[data-featured-line="2"]')];
    this.#status = root.querySelector('[data-featured-status]');
    this.#list = root.querySelector('[data-featured]');
    this.#template = root.querySelector('#featured-card');
    this.#waitForPage = waitForPage;
    if (!reducedMotion) {
      this.#observer = new IntersectionObserver(
        (entries) => entries.filter((entry) => entry.isIntersecting).forEach((entry) => this.#flip(entry.target)),
        { threshold: FLIP_THRESHOLD },
      );
    }
  }

  /** Le prochain affichage est une nouvelle main : cartes face cachée, retournées une à une. */
  deal() {
    this.#dealing = true;
  }

  /**
   * @param {{ drawn: string[], jackpot: boolean, featured: import('../models/ProjectModel.js').ProjectItem[] }} state
   */
  render({ drawn, jackpot, featured }) {
    const heading = jackpot ? HEADINGS.jackpot : HEADINGS.default;
    this.#lines.forEach((line, index) => {
      line.textContent = heading[index];
    });
    this.#status.textContent = drawn.length
      ? `Sélection de la machine à sous : ${drawn.join(' · ')}`
      : 'Les trois projets les plus récents.';

    const cards = featured.map((item, index) => this.#card(item, index));
    this.#list.replaceChildren(...cards);
    if (!this.#observer || !this.#dealing) return;
    this.#dealing = false;

    // Nouvelle main : cartes face cachée, retournées une à une quand la page est visible.
    this.#observer.disconnect();
    cards.forEach((card) => card.toggleAttribute('data-face-down', true));
    this.#waitForPage().then(() => cards.forEach((card) => this.#observer.observe(card)));
  }

  #flip(card) {
    this.#observer.unobserve(card);
    setTimeout(() => card.removeAttribute('data-face-down'), FLIP_DELAY);
  }

  #card({ project, label, context, matches }, index) {
    const card = this.#template.content.firstElementChild.cloneNode(true);
    const number = String(index + 1).padStart(2, '0');
    card.querySelector('[data-cover]').prepend(createCover(project, COVER_SIZES));
    card.querySelector('[data-number]').textContent = number;
    card.querySelectorAll('[data-back-number]').forEach((corner) => {
      corner.textContent = number;
    });
    card.querySelector('[data-meta]').textContent = [label, project.date.slice(0, 4), context, project.example && 'Exemple']
      .filter(Boolean)
      .join(' · ');
    card.querySelector('[data-title]').textContent = project.title;
    card.querySelector('[data-summary]').textContent = project.summary;

    const match = card.querySelector('[data-match]');
    match.hidden = matches.length === 0;
    card.querySelector('[data-match-text]').textContent =
      `${matches.length > 1 ? 'Compétences tirées' : 'Compétence tirée'} : ${matches.join(' · ')}`;

    card.querySelector('[data-project-link]').href = projectUrl(project.slug);
    card.querySelector('[data-open-name]').textContent = ` ${project.title}`;
    return card;
  }
}
