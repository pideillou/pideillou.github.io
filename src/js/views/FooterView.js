/**
 * Pied de page : score de la partie du visiteur (jetons, compétences, secrets, fiches lues)
 * et raccourcis vers le terminal.
 */
export default class FooterView {
  #score;
  #stats;
  #bars;
  #root;

  /** @param {HTMLElement} root Élément [data-footer]. */
  constructor(root) {
    this.#root = root;
    this.#score = root.querySelector('[data-footer-score]');
    this.#stats = Object.fromEntries([...root.querySelectorAll('[data-footer-stat]')].map((el) => [el.dataset.footerStat, el]));
    this.#bars = Object.fromEntries([...root.querySelectorAll('[data-footer-bar]')].map((el) => [el.dataset.footerBar, el]));
    // Le score n'a de sens qu'avec JavaScript : il est caché dans le HTML servi.
    this.#score.hidden = false;
  }

  /**
   * @param {{ tokens: number, skills: { found: number, total: number }, secrets: { found: number, total: number },
   *   levels: { found: number, total: number } }} stats
   */
  render({ tokens, ...progress }) {
    this.#stats.tokens.textContent = String(tokens);
    for (const [id, { found, total }] of Object.entries(progress)) {
      this.#stats[id].textContent = `${found}/${total}`;
      this.#bars[id].style.setProperty('--fill', String(total ? found / total : 0));
    }
  }

  /** @param {(action: 'terminal' | 'credits') => void} handler */
  bindAction(handler) {
    this.#root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-footer-action]');
      if (button) handler(button.dataset.footerAction);
    });
  }
}
