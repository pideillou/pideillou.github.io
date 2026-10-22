/**
 * Effacement des données du site enregistrées dans le navigateur, après confirmation.
 */
export default class DataResetController {
  /**
   * @param {import('../views/DataResetView.js').default} view
   * @param {{ clear: () => number }} options clear : efface les données, renvoie le nombre d'éléments effacés.
   */
  constructor(view, { clear }) {
    view.bind({
      onAsk: () => view.askConfirmation(),
      onCancel: () => view.done('Rien n’a été effacé.'),
      onConfirm: () => {
        const count = clear();
        view.done(count ? 'C’est fait : nouvelle partie ! Le site repart de zéro dès la prochaine page.' : 'Il n’y avait rien à effacer.');
      },
    });
  }
}
