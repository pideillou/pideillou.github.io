import { ALL } from '../models/ProjectModel.js';
import { createCover, createSkillChips, projectUrl } from './projectParts.js';

// Bouton de filtre ; aria-pressed le colore quand il est actif.
const FILTER_CLASSES =
  'inline-flex min-h-10 items-center gap-2 rounded-full border border-muted/40 px-4 font-mono text-xs text-ink transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-surface';
const COVER_SIZES = '(min-width: 1024px) 18rem, (min-width: 768px) 14rem, 100vw';

/**
 * Section « Tous les projets » : filtres par catégorie et par cadre, liste en lignes.
 */
export default class ProjectListView {
  #filters;
  #contextFilters;
  #buttons = null;
  #contextButtons = null;
  #list;
  #status;
  #template;

  /** @param {HTMLElement} root Section #tous-les-projets. */
  constructor(root) {
    this.#filters = root.querySelector('[data-project-filters]');
    this.#list = root.querySelector('[data-project-list]');
    this.#status = root.querySelector('[data-project-list-status]');
    this.#template = root.querySelector('#project-row');

    // Filtres par cadre, juste sous ceux des catégories (marge négative : on rapproche les deux rangées de la grille).
    this.#contextFilters = document.createElement('div');
    this.#contextFilters.setAttribute('role', 'group');
    this.#contextFilters.setAttribute('aria-label', 'Filtrer les projets par cadre');
    this.#contextFilters.className = '-mt-4 flex flex-wrap items-center gap-2 lg:col-start-2 lg:-mt-8';
    this.#filters.after(this.#contextFilters);
  }

  /**
   * @param {{ filter: string, context: string, categories: { id: string, label: string, count: number }[],
   *   contexts: { id: string, label: string, count: number }[],
   *   list: import('../models/ProjectModel.js').ProjectItem[] }} state
   */
  render({ filter, context, categories, contexts, list }) {
    const total = categories.reduce((sum, { count }) => sum + count, 0);
    this.#buttons ??= this.#createFilters(this.#filters, categories, { all: 'Tous', total, key: 'filter' });
    this.#contextButtons ??= this.#createFilters(this.#contextFilters, contexts, { all: 'Tous les cadres', total, key: 'context' });
    // Un seul cadre renseigné : rien à filtrer, le groupe reste caché.
    this.#contextFilters.hidden = this.#contextButtons.length < 3;
    this.#buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    this.#contextButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.context === context)));

    const rows = list.map((item) => this.#row(item));
    if (!rows.length) {
      const empty = document.createElement('li');
      empty.className = 'border-t border-muted/30 py-8 text-muted';
      empty.textContent = 'Aucun projet ne correspond à ces deux filtres pour l’instant.';
      rows.push(empty);
    }
    this.#list.replaceChildren(...rows);

    // Annoncé aux lecteurs d'écran seulement quand le nombre change (filtre), pas à chaque tirage.
    const plural = list.length > 1 ? 's' : '';
    const status = `${list.length} projet${plural} affiché${plural}.`;
    if (this.#status.textContent !== status) this.#status.textContent = status;
  }

  /** @param {(id: string) => void} handler Clic sur un filtre de catégorie. */
  bindFilter(handler) {
    this.#filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (button) handler(button.dataset.filter);
    });
  }

  /** @param {(id: string) => void} handler Clic sur un filtre de cadre. */
  bindContext(handler) {
    this.#contextFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-context]');
      if (button) handler(button.dataset.context);
    });
  }

  /**
   * Boutons d'un groupe de filtres. Les entrées sans projet n'ont pas de bouton.
   * @param {HTMLElement} container
   * @param {{ id: string, label: string, count: number }[]} entries
   * @param {{ all: string, total: number, key: 'filter' | 'context' }} options
   *   all : libellé du bouton « tout » ; total : nombre de projets ; key : attribut data-* du bouton.
   */
  #createFilters(container, entries, { all, total, key }) {
    const buttons = [{ id: ALL, label: all, count: total }, ...entries.filter(({ count }) => count > 0)].map(
      ({ id, label, count }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = FILTER_CLASSES;
        button.dataset[key] = id;
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
    container.replaceChildren(...buttons);
    return buttons;
  }

  #row({ project, number, label, context, matches }) {
    const row = this.#template.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-number]').textContent = String(number).padStart(2, '0');
    row.querySelector('[data-cover]').append(createCover(project, COVER_SIZES));
    row.querySelector('[data-meta]').textContent = [label, project.date.slice(0, 4), context, project.example && 'Exemple']
      .filter(Boolean)
      .join(' / ');
    row.querySelector('[data-title]').textContent = project.title;
    row.querySelector('[data-summary]').textContent = project.summary;
    row.querySelector('[data-stack]').replaceChildren(...createSkillChips(project.stack, matches));
    row.querySelector('[data-project-link]').href = projectUrl(project.slug);
    row.querySelector('[data-open-label]').textContent = `Voir le projet ${project.title}`;
    return row;
  }
}
