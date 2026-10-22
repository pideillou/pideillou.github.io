/**
 * Relie le score du pied de page aux modèles du site : il se met à jour à chaque jeton
 * gagné ou compétence découverte.
 */
export default class FooterController {
  /**
   * @param {import('../views/FooterView.js').default} view
   * @param {{ sources: EventTarget[], getStats: () => Parameters<import('../views/FooterView.js').default['render']>[0],
   *   onAction: (action: 'terminal' | 'credits') => void }} options
   *   sources : modèles qui émettent « change » (jetons, collection).
   */
  constructor(view, { sources, getStats, onAction }) {
    const update = () => view.render(getStats());
    sources.forEach((source) => source.addEventListener('change', update));
    view.bindAction(onAction);
    update();
  }
}
