// Délai entre deux lignes affichées, pour un effet « sortie de terminal » (ms).
const LINE_DELAY = 25;
// Nombre maximal de lignes gardées à l'écran.
const MAX_LINES = 200;

// Classes complètes de chaque ton de ligne (jamais construites dynamiquement).
const TONE_CLASSES = {
  default: 'text-ink',
  muted: 'text-muted',
  accent: 'text-accent',
  success: 'text-online',
  error: 'text-accent',
  prompt: 'mt-2 text-muted first:mt-0',
};
const SWATCH_CLASSES = 'mr-2 inline-block size-3 rounded-sm border border-muted/40 align-middle';
const LINK_CLASSES = 'underline decoration-accent underline-offset-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent';

/**
 * Terminal fixe en bas de l'écran : en-tête repliable, sortie, saisie et raccourcis.
 */
export default class TerminalView {
  #root;
  #toggle;
  #panel;
  #output;
  #scroller;
  #form;
  #input;
  #mini;
  #animate;
  #queue = Promise.resolve();

  /**
   * @param {HTMLElement} root Conteneur [data-terminal].
   * @param {{ reducedMotion: boolean }} options
   */
  constructor(root, { reducedMotion }) {
    const $ = (selector) => root.querySelector(selector);
    this.#root = root;
    this.#toggle = $('[data-console-toggle]');
    this.#panel = $('[data-console-panel]');
    this.#output = $('[data-terminal-output]');
    this.#scroller = $('[data-terminal-scroll]');
    this.#form = $('[data-terminal-form]');
    this.#input = $('[data-terminal-input]');
    this.#mini = { found: $('[data-mini-found]'), total: $('[data-mini-total]'), tokens: $('[data-mini-tokens]') };
    this.#animate = !reducedMotion;

    this.#toggle.addEventListener('click', () => this.setOpen(this.#panel.hidden));
  }

  /** @returns {boolean} */
  get isOpen() {
    return !this.#panel.hidden;
  }

  /**
   * Ouvre ou ferme le terminal. À l'ouverture, le curseur va dans le champ.
   * @param {boolean} open
   */
  setOpen(open) {
    this.#panel.hidden = !open;
    this.#toggle.setAttribute('aria-expanded', String(open));
    this.#root.toggleAttribute('data-open', open);
    if (open) {
      this.#input.focus();
      this.#scrollToEnd();
    }
  }

  /**
   * Ajoute des lignes à la sortie, une par une si les animations sont permises.
   * @param {import('../models/TerminalModel.js').Line[]} lines
   */
  print(lines) {
    this.#queue = this.#queue.then(async () => {
      for (const line of lines) {
        // Pause avant la ligne (fausse connexion ssh…), seulement si les animations sont permises.
        if (line.pause && this.#animate) await new Promise((resolve) => setTimeout(resolve, line.pause));
        this.#output.append(this.#createLine(line));
        while (this.#output.childElementCount > MAX_LINES) this.#output.firstElementChild.remove();
        this.#scrollToEnd();
        if (this.#animate) await new Promise((resolve) => setTimeout(resolve, LINE_DELAY));
      }
    });
  }

  /**
   * Insère un élément interactif dans la sortie (jeu du dino…), après les lignes en attente.
   * @param {HTMLElement} element
   * @returns {Promise<void>} Résolue une fois l'élément dans la page.
   */
  mount(element) {
    this.#queue = this.#queue.then(() => {
      const item = document.createElement('li');
      item.append(element);
      this.#output.append(item);
      this.#scrollToEnd();
    });
    return this.#queue;
  }

  /** Vide la sortie. */
  clear() {
    this.#queue = this.#queue.then(() => this.#output.replaceChildren());
  }

  /**
   * Résumé dans l'en-tête : collection et jetons.
   * @param {{ found: number, total: number, tokens: number }} summary
   */
  renderSummary({ found, total, tokens }) {
    this.#mini.found.textContent = String(found);
    this.#mini.total.textContent = String(total);
    this.#mini.tokens.textContent = String(tokens);
  }

  /**
   * Fait défiler la page jusqu'à une section (commande cd).
   * @param {string} id
   */
  scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: this.#animate ? 'smooth' : 'auto' });
  }

  /** Cache ce qui concerne la machine à sous (animations réduites). */
  hideDraw() {
    this.#root.querySelectorAll('[data-mini-draw]').forEach((element) => {
      element.hidden = true;
    });
  }

  /** @param {(input: string) => void} handler Saisie validée, ou raccourci cliqué. */
  bindRun(handler) {
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler(this.#input.value);
      this.#input.value = '';
    });
    this.#root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-terminal-run]');
      if (!button) return;
      handler(button.dataset.terminalRun);
      this.#input.focus();
    });
  }

  /**
   * Tab (complétion) et flèches (historique) dans le champ.
   * @param {{ complete: (input: string) => string, browse: (step: -1 | 1) => string }} handlers
   */
  bindKeys({ complete, browse }) {
    this.#input.addEventListener('keydown', (event) => {
      if (event.key === 'Tab' && this.#input.value.trim()) {
        event.preventDefault();
        this.#input.value = complete(this.#input.value);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.#input.value = browse(event.key === 'ArrowUp' ? -1 : 1);
      } else if (event.key === 'Escape') {
        this.setOpen(false);
        this.#toggle.focus();
      }
    });
  }

  /**
   * Raccourci global : Ctrl + K (ou Cmd + K) et la touche ², hors champs de saisie.
   * @param {() => void} handler
   */
  bindShortcut(handler) {
    document.addEventListener('keydown', (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      const typing = target.closest('input, textarea, select') || target.isContentEditable;
      const ctrlK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (ctrlK || (event.key === '²' && !typing)) {
        event.preventDefault();
        handler();
      }
    });
  }

  /**
   * @param {import('../models/TerminalModel.js').Line} line
   * @returns {HTMLLIElement}
   */
  #createLine({ text, tone = 'default', href, swatch }) {
    const item = document.createElement('li');
    item.className = TONE_CLASSES[tone] ?? TONE_CLASSES.default;
    if (swatch) {
      // Pastille de couleur : valeur calculée en JS, seule exception admise aux styles en ligne.
      const chip = document.createElement('span');
      chip.className = SWATCH_CLASSES;
      chip.style.backgroundColor = swatch;
      chip.setAttribute('aria-hidden', 'true');
      item.append(chip);
    }
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.className = LINK_CLASSES;
      link.textContent = text;
      item.append(link);
    } else {
      item.append(text);
    }
    return item;
  }

  #scrollToEnd() {
    this.#scroller.scrollTop = this.#scroller.scrollHeight;
  }
}
