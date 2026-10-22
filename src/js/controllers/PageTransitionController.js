// Au-delà de ce délai (ms), l'arrivée ne vient pas d'un clic sur le site (onglet rouvert…).
const MAX_AGE = 10_000;

/**
 * Choisit la transition entre deux pages du site selon le lien suivi :
 * data-transition="cover" (ouvrir un projet), "next", "previous" ou "back".
 * Le type de sortie est noté dans la session, pour que la page suivante joue l'entrée assortie.
 */
export default class PageTransitionController {
  #view;
  #arrival;

  /**
   * @param {import('../views/PageTransitionView.js').default} view
   * @param {import('../services/StorageService.js').default} storage Stockage de session.
   */
  constructor(view, storage) {
    this.#view = view;
    const saved = storage.load(null);
    storage.remove();
    this.#arrival = saved && Date.now() - saved.at < MAX_AGE ? saved.type : null;

    view.bindLinks(async (link) => {
      const type = link.dataset.transition;
      storage.save({ type, at: Date.now() });
      if (type === 'cover') await view.expand(link.closest('li')?.querySelector('[data-cover]') ?? null);
      else await view.slideOut(type);
      view.navigate(link.href);
    });
  }

  /** @returns {string | null} Façon dont le visiteur est arrivé (cover, next, previous, back), ou null. */
  get arrival() {
    return this.#arrival;
  }

  /**
   * Joue l'entrée de la page.
   * @param {{ hero?: Element | null, parts?: Element[] }} [page] Visuel et blocs de la fiche projet.
   */
  enter({ hero = null, parts = [] } = {}) {
    if (!this.#arrival) return;
    if (this.#arrival === 'cover' && hero) this.#view.shrink(hero, parts);
    else this.#view.slideIn(this.#arrival);
  }
}
