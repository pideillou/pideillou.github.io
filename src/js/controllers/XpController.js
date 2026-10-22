/**
 * Relie la barre d'XP au défilement de la page.
 */
export default class XpController {
  /**
   * @param {import('../models/XpModel.js').default} model
   * @param {import('../views/XpBarView.js').default} view
   * @param {{ onComplete: () => import('../views/XpBarView.js').LevelUp }} options
   *   onComplete : appelé en bas de page, renvoie les jetons gagnés et l'avancée dans les fiches projet.
   */
  constructor(model, view, { onComplete }) {
    model.addEventListener('change', ({ detail }) => view.render(detail));
    model.addEventListener('complete', () => view.levelUp(onComplete()));
    view.bindScroll((progress) => model.set(progress));
  }
}
