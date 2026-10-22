import { ALL } from '../models/ProjectModel.js';
import { createCover, createSkillChips, projectUrl } from './projectParts.js';

// Bouton de filtre ; aria-pressed le colore quand il est actif.
const FILTER_CLASSES =
  'inline-flex min-h-10 items-center gap-2 rounded-full border border-muted/40 px-4 font-mono text-xs text-ink transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface';
const COVER_SIZES = '(min-width: 1024px) 18rem, (min-width: 768px) 14rem, 100vw';

/**
 * Section « Tous les projets » : filtres par catégorie et liste en lignes.
 */
export default class ProjectListView {
  #filters;
  #buttons = null;
  #list;
  #status;
  #template;

  /** @param {HTMLElement} root Section #tous-les-projets. */
  constructor(root) {
    this.#filters = root.querySelector('[data-project-filters]');
    this.#list = root.querySelector('[data-project-list]');
    this.#status = root.querySelector('[data-project-list-status]');
    this.#template = root.querySelector('#project-row');
  }

  /**
   * @param {{ filter: string, categories: { id: string, label: string, count: number }[],
   *   list: import('../models/ProjectModel.js').ProjectItem[] }} state
   */
  render({ filter, categories, list }) {
    this.#buttons ??= this.#createFilters(categories);
    this.#buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    this.#list.replaceChildren(...list.map((item) => this.#row(item)));

    // Annoncé aux lecteurs d'écran seulement quand le nombre change (filtre), pas à chaque tirage.
    const plural = list.length > 1 ? 's' : '';
    const status = `${list.length} projet${plural} affiché${plural}.`;
    if (this.#status.textContent !== status) this.#status.textContent = status;
  }

  /** @param {(id: string) => void} handler Clic sur un filtre. */
  bindFilter(handler) {
    this.#filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (button) handler(button.dataset.filter);
    });
  }

  // Les catégories sans projet n'ont pas de bouton.
  #createFilters(categories) {
    const total = categories.reduce((sum, { count }) => sum + count, 0);
    const buttons = [{ id: ALL, label: 'Tous', count: total }, ...categories.filter(({ count }) => count > 0)].map(
      ({ id, label, count }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = FILTER_CLASSES;
        button.dataset.filter = id;
        const number = document.createElement('span');
        number.className = 'text-2xs';
        number.textContent = String(count);
        const hint = document.createElement('span');
        hint.className = 'sr-only';
        hint.textContent = count > 1 ? ' projets' : ' projet';
        // Espace après le libellé : sans lui, un lecteur d'écran lirait « Tous7 ».
        button.append(`${label} `, number, hint);
        return button;
      },
    );
    this.#filters.replaceChildren(...buttons);
    return buttons;
  }

  #row({ project, number, label, matches }) {
    const row = this.#template.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-number]').textContent = String(number).padStart(2, '0');
    row.querySelector('[data-cover]').append(createCover(project, COVER_SIZES));
    row.querySelector('[data-meta]').textContent =
      `${label} / ${project.date.slice(0, 4)}${project.example ? ' / Exemple' : ''}`;
    row.querySelector('[data-title]').textContent = project.title;
    row.querySelector('[data-summary]').textContent = project.summary;
    row.querySelector('[data-stack]').replaceChildren(...createSkillChips(project.stack, matches));
    row.querySelector('[data-project-link]').href = projectUrl(project.slug);
    row.querySelector('[data-open-label]').textContent = `Voir le projet ${project.title}`;
    return row;
  }
}
