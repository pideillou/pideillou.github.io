// Touches du clavier et action correspondante sur la liste d'onglets.
const KEYS = { ArrowDown: 'next', ArrowRight: 'next', ArrowUp: 'previous', ArrowLeft: 'previous', Home: 'first', End: 'last' };

/**
 * Onglets accessibles (motif « tabs » de l'ARIA) : une seule catégorie visible à la fois,
 * flèches, Début et Fin pour passer de l'une à l'autre.
 * Amélioration progressive : sans JS, la liste reste cachée et toutes les catégories
 * s'affichent l'une sous l'autre.
 */
export default class TabsView {
  #list;
  #tabs;
  #panels;

  /** @param {HTMLElement} root Conteneur des onglets [data-pause]. */
  constructor(root) {
    this.#list = root.querySelector('[data-tabs-list]');
    this.#tabs = [...this.#list.querySelectorAll('[data-tab]')];
    this.#panels = [...root.querySelectorAll('[data-tab-panel]')];

    this.#list.setAttribute('role', 'tablist');
    this.#list.setAttribute('aria-label', 'Catégories du profil');
    this.#list.setAttribute('aria-orientation', 'vertical');
    this.#tabs.forEach((tab) => {
      const panel = this.#panel(tab.dataset.tab);
      tab.id = `${panel.id}-onglet`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
    });
    this.#list.hidden = false;
  }

  /** @returns {string[]} Identifiants des onglets, dans l'ordre. */
  get ids() {
    return this.#tabs.map((tab) => tab.dataset.tab);
  }

  /**
   * @param {{ selected: string }} state
   * @param {{ focus?: boolean }} [options] focus : déplacer le focus sur l'onglet choisi (clavier).
   */
  render({ selected }, { focus = false } = {}) {
    this.#tabs.forEach((tab) => {
      const active = tab.dataset.tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      this.#panel(tab.dataset.tab).hidden = !active;
      if (active && focus) tab.focus();
    });
  }

  /** @param {(id: string) => void} handler Clic sur un onglet. */
  bindSelect(handler) {
    this.#list.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) handler(tab.dataset.tab);
    });
  }

  /** @param {(action: 'next' | 'previous' | 'first' | 'last') => void} handler */
  bindKeys(handler) {
    this.#list.addEventListener('keydown', (event) => {
      const action = KEYS[event.key];
      if (!action) return;
      event.preventDefault();
      handler(action);
    });
  }

  #panel(id) {
    return this.#panels.find((panel) => panel.dataset.tabPanel === id);
  }
}
