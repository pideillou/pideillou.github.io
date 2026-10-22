// Thèmes du site, chacun avec une identité différente. « unlock » : condition pour débloquer un thème secret.
const THEMES = [
  { id: 'defaut', label: 'sombre et serif, la palette d’origine' },
  { id: 'papier', label: 'clair, crème et encre, comme un magazine' },
  { id: 'crt', label: 'vieux moniteur : tout en police mono, vert phosphore' },
  { id: 'contraste', label: 'noir et blanc, contraste maximal (accessibilité)' },
  { id: 'or', label: 'doré, réservé aux gagnants', unlock: 'jackpot' },
  { id: 'arcade', label: 'borne d’arcade : angles carrés, jaune et rose', unlock: 'konami' },
];

/**
 * Thème choisi par le visiteur, et thèmes déjà essayés, gardés d'une visite à l'autre.
 * Émet « change » avec { theme } à chaque changement.
 */
export default class ThemeModel extends EventTarget {
  #storage;
  #isUnlocked;
  #current;
  #tried;

  /**
   * @param {import('../services/StorageService.js').default} storage
   * @param {(condition: string) => boolean} isUnlocked Vrai si la condition de déblocage est remplie.
   */
  constructor(storage, isUnlocked) {
    super();
    this.#storage = storage;
    this.#isUnlocked = isUnlocked;
    const saved = storage.load({ current: 'defaut', tried: ['defaut'] });
    this.#current = THEMES.some((theme) => theme.id === saved.current) ? saved.current : 'defaut';
    this.#tried = new Set(Array.isArray(saved.tried) ? saved.tried : ['defaut']);
  }

  /** @returns {string} */
  get current() {
    return this.#current;
  }

  /** @returns {{ id: string, label: string, unlock?: string, locked: boolean }[]} */
  get list() {
    return THEMES.map((theme) => ({ ...theme, locked: Boolean(theme.unlock) && !this.#isUnlocked(theme.unlock) }));
  }

  /** @returns {number} Nombre de thèmes différents déjà essayés. */
  get triedCount() {
    return this.#tried.size;
  }

  /**
   * @param {string} id
   * @returns {'ok' | 'locked' | 'unknown'}
   */
  set(id) {
    const theme = this.list.find((item) => item.id === id);
    if (!theme) return 'unknown';
    if (theme.locked) return 'locked';
    this.#current = id;
    this.#tried.add(id);
    this.#storage.save({ current: id, tried: [...this.#tried] });
    this.dispatchEvent(new CustomEvent('change', { detail: { theme: id } }));
    return 'ok';
  }
}
