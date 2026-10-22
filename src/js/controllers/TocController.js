/**
 * Relie le sommaire d'une fiche projet à la partie visible à l'écran.
 * Réutilise NavModel, qui retient déjà une section active.
 */
export default class TocController {
  /**
   * @param {import('../models/NavModel.js').default} model
   * @param {import('../views/TocView.js').default} view
   */
  constructor(model, view) {
    model.addEventListener('change', ({ detail }) => view.render(detail));
    view.observeSections(view.sectionIds, (id) => model.setActive(id));
  }
}
