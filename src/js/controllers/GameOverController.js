// Secondes avant le retour automatique à l'accueil.
const SECONDS = 10;

/**
 * Compte à rebours de la page 404 : à zéro, retour à l'accueil.
 * Il s'arrête dès que le visiteur interagit (temps réglable, WCAG 2.2.1).
 */
export default class GameOverController {
  /**
   * @param {import('../views/GameOverView.js').default} view
   * @param {{ home: string, hint: string }} options
   */
  constructor(view, { home, hint }) {
    let remaining = SECONDS;
    const render = (running) => view.render({ remaining, total: SECONDS, running });

    view.intro();
    render(true);
    view.announce(`Retour automatique à l’accueil dans ${SECONDS} secondes. Le bouton « Rester ici », ou n’importe quelle touche, l’arrête.`);
    view.showHint(hint);

    const timer = setInterval(() => {
      remaining -= 1;
      render(true);
      if (remaining > 0) return;
      clearInterval(timer);
      view.go(home);
    }, 1000);

    view.bindStop(() => {
      if (remaining === 0) return;
      clearInterval(timer);
      render(false);
      view.announce('Compte à rebours arrêté. Tu peux rester ici.');
    });
  }
}
