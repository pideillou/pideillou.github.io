/**
 * Relie la mini-carte à la section visible, déjà suivie par la navigation (NavModel).
 */
export default class MiniMapController {
  /**
   * @param {import('../models/NavModel.js').default} model
   * @param {import('../views/MiniMapView.js').default} view
   */
  constructor(model, view) {
    model.addEventListener('change', ({ detail }) => view.render(detail));
    view.render(model.state);
  }
}
