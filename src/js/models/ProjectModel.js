// Nombre de projets mis en avant par la machine à sous.
const FEATURED_COUNT = 3;
// Filtre qui affiche toutes les catégories.
export const ALL = 'all';

/**
 * @typedef {{ slug: string, title: string, summary: string, category: string, date: string,
 *   role: string, stack: string[], example: boolean, links: { demo?: string, repo?: string },
 *   cover?: { src: string, alt: string, width: number, height: number, srcset?: { src: string, width: number }[] } }} Project
 * @typedef {{ project: Project, number: number, label: string, matches: string[] }} ProjectItem
 */

/**
 * Projets du portfolio : les trois mis en avant selon le dernier tirage de la machine à sous,
 * et la liste complète, filtrée par catégorie.
 * Émet « change » avec l'état complet à chaque tirage ou changement de filtre.
 */
export default class ProjectModel extends EventTarget {
  #items;
  #categories;
  #drawn = [];
  #filter = ALL;

  /**
   * @param {{ projects: Project[], categories: { id: string, label: string }[] }} data
   */
  constructor({ projects, categories }) {
    super();
    this.#categories = categories;
    // Numéro fixe par projet, du plus récent au plus ancien : il ne change pas avec le filtre.
    this.#items = [...projects]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((project, index) => ({
        project,
        number: index + 1,
        label: categories.find((category) => category.id === project.category)?.label ?? project.category,
      }));
  }

  /**
   * @param {string[]} skills Compétences tirées (la même trois fois en cas de jackpot).
   */
  setDrawn(skills) {
    this.#drawn = [...new Set(skills)];
    this.#emit();
  }

  /** @param {string} id Identifiant de catégorie, ou ALL. */
  setFilter(id) {
    if (id !== ALL && !this.#categories.some((category) => category.id === id)) return;
    this.#filter = id;
    this.#emit();
  }

  /**
   * @returns {{ drawn: string[], jackpot: boolean, featured: ProjectItem[], filter: string,
   *   categories: { id: string, label: string, count: number }[], list: ProjectItem[] }}
   */
  get state() {
    const items = this.#items.map((item) => this.#withMatches(item));
    // Tri stable : à égalité de compétences tirées, le plus récent reste devant.
    const featured = [...items].sort((a, b) => b.matches.length - a.matches.length).slice(0, FEATURED_COUNT);
    return {
      drawn: this.#drawn,
      jackpot: this.#drawn.length === 1,
      featured,
      filter: this.#filter,
      categories: this.#categories.map((category) => ({
        ...category,
        count: items.filter(({ project }) => project.category === category.id).length,
      })),
      list: items.filter(({ project }) => this.#filter === ALL || project.category === this.#filter),
    };
  }

  #withMatches(item) {
    return { ...item, matches: item.project.stack.filter((skill) => this.#drawn.includes(skill)) };
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
