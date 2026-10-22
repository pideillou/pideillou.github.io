/**
 * Applique le thème choisi au chargement et à chaque changement.
 */
export default class ThemeController {
  /**
   * @param {import('../models/ThemeModel.js').default} model
   * @param {import('../views/ThemeView.js').default} view
   */
  constructor(model, view) {
    model.addEventListener('change', (event) => view.render(event.detail, { animate: true }));
    view.render({ theme: model.current });
  }
}
