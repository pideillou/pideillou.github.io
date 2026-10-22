// Section du haut de page : aucun lien n'y correspond, la nav n'a alors pas de lien actif.
const TOP_SECTION = 'accueil';

/**
 * Relie la pilule de navigation à son état.
 */
export default class NavController {
  /**
   * @param {import('../models/NavModel.js').default} model
   * @param {import('../views/NavView.js').default} view
   */
  constructor(model, view) {
    model.addEventListener('change', (event) => view.render(event.detail));

    view.bindToggle(() => model.toggle());
    view.bindClose(() => model.close());
    view.bindEscape(() => {
      if (!model.isOpen) return;
      model.close();
      view.focusToggle();
    });
    view.observeSections([TOP_SECTION, ...view.sectionIds], (id) => model.setActive(id));

    view.render(model.state);
  }
}
