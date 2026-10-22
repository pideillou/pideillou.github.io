/**
 * Relie les onglets du menu pause à leur état.
 */
export default class TabsController {
  /**
   * @param {import('../models/TabsModel.js').default} model
   * @param {import('../views/TabsView.js').default} view
   */
  constructor(model, view) {
    // Au clavier, le focus suit l'onglet choisi ; à la souris, il reste où il est.
    let fromKeyboard = false;
    model.addEventListener('change', ({ detail }) => {
      view.render(detail, { focus: fromKeyboard });
      fromKeyboard = false;
    });
    view.bindSelect((id) => model.select(id));
    view.bindKeys((action) => {
      fromKeyboard = true;
      model[action]();
    });
    view.render(model.state);
  }
}
