/**
 * Relie la lampe à la souris et à son interrupteur.
 */
export default class SpotlightController {
  /**
   * @param {import('../models/LampModel.js').default} model
   * @param {import('../views/SpotlightView.js').default} view
   */
  constructor(model, view) {
    model.addEventListener('change', (event) => view.render(event.detail));
    view.bindToggle(() => model.toggle());
    view.bindPointer(
      (position) => view.move(position),
      () => view.hide(),
    );
    view.render(model.state);
  }
}
