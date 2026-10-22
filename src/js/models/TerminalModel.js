/**
 * @typedef {{ text: string, tone?: 'default' | 'muted' | 'accent' | 'success' | 'error' | 'prompt',
 *   href?: string, swatch?: string, pause?: number }} Line
 *   swatch : couleur d'une pastille affichée avant le texte ; pause : attente avant la ligne (ms).
 * @typedef {{ description?: string, hidden?: boolean, complete?: () => string[],
 *   run: (args: string[], input: string) => Line[] | void }} Command
 */

// Nombre de commandes gardées dans l'historique.
const HISTORY_SIZE = 50;

/**
 * Terminal : exécute les commandes tapées, garde l'historique et propose la complétion.
 * Émet « output » avec { lines } et « clear ».
 */
export default class TerminalModel extends EventTarget {
  #commands;
  #history = [];
  #cursor = 0;

  /** @param {Record<string, Command>} commands */
  constructor(commands) {
    super();
    this.#commands = commands;
  }

  /** @returns {[string, Command][]} Commandes visibles dans l'aide. */
  get publicCommands() {
    return Object.entries(this.#commands).filter(([, command]) => !command.hidden);
  }

  /** @returns {string[]} */
  get history() {
    return [...this.#history];
  }

  /**
   * Affiche des lignes sans commande (messages du site : bonus, tirage…).
   * @param {Line[]} lines
   */
  print(lines) {
    this.dispatchEvent(new CustomEvent('output', { detail: { lines } }));
  }

  /** Vide l'écran du terminal. */
  clear() {
    this.dispatchEvent(new Event('clear'));
  }

  /**
   * Exécute une ligne de commande.
   * @param {string} input
   */
  run(input) {
    const line = input.trim();
    this.print([{ text: `$ ${line}`, tone: 'prompt' }]);
    if (!line) return;

    this.#history = [...this.#history, line].slice(-HISTORY_SIZE);
    this.#cursor = this.#history.length;

    const [name, ...args] = line.split(/\s+/);
    const command = this.#commands[name.toLowerCase()];
    if (!command) {
      this.print([{ text: `commande introuvable : ${name}. Tape help pour la liste.`, tone: 'error' }]);
      return;
    }
    const lines = command.run(args, line);
    if (lines?.length) this.print(lines);
  }

  /**
   * Complète la saisie : nom de commande, ou argument si la commande le permet.
   * @param {string} input
   * @returns {string} Saisie complétée (inchangée si plusieurs choix ou aucun).
   */
  complete(input) {
    const [name, ...rest] = input.trimStart().split(/\s+/);
    if (rest.length === 0) {
      const matches = this.publicCommands.map(([key]) => key).filter((key) => key.startsWith(name));
      if (matches.length === 1) return `${matches[0]} `;
      if (matches.length > 1) this.print([{ text: matches.join('  '), tone: 'muted' }]);
      return input;
    }

    const options = this.#commands[name]?.complete?.() ?? [];
    const partial = rest.join(' ');
    const matches = options.filter((option) => option.startsWith(partial));
    if (matches.length === 1) return `${name} ${matches[0]}`;
    if (matches.length > 1) this.print([{ text: matches.join('  '), tone: 'muted' }]);
    return input;
  }

  /**
   * Remonte (-1) ou descend (+1) dans l'historique.
   * @param {-1 | 1} step
   * @returns {string}
   */
  browse(step) {
    this.#cursor = Math.min(Math.max(this.#cursor + step, 0), this.#history.length);
    return this.#history[this.#cursor] ?? '';
  }
}
