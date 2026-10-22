/**
 * Lecture et écriture JSON dans le stockage du visiteur : localStorage (gardé d'une visite
 * à l'autre) ou sessionStorage (oublié à la fermeture de l'onglet).
 * Le stockage peut être bloqué (navigation privée, cookies refusés) :
 * on renvoie alors la valeur par défaut, sans erreur.
 */
export default class StorageService {
  #key;
  #session;

  /**
   * @param {string} key Clé de stockage.
   * @param {{ session?: boolean }} [options] session : stockage limité à l'onglet.
   */
  constructor(key, { session = false } = {}) {
    this.#key = key;
    this.#session = session;
  }

  get #area() {
    return this.#session ? sessionStorage : localStorage;
  }

  /**
   * @template T
   * @param {T} fallback Valeur renvoyée si rien n'est stocké ou lisible.
   * @returns {T}
   */
  load(fallback) {
    try {
      const raw = this.#area.getItem(this.#key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  /** @param {unknown} value */
  save(value) {
    try {
      this.#area.setItem(this.#key, JSON.stringify(value));
    } catch {
      // Stockage indisponible : la progression ne sera simplement pas gardée.
    }
  }

  /**
   * Efface toutes les données du site dans les deux stockages (bouton des mentions légales).
   * @param {string} prefix Début commun des clés du site.
   * @returns {number} Nombre de clés effacées.
   */
  static clearAll(prefix) {
    let count = 0;
    for (const area of ['localStorage', 'sessionStorage']) {
      try {
        const storage = window[area];
        const keys = Object.keys(storage).filter((key) => key.startsWith(prefix));
        keys.forEach((key) => storage.removeItem(key));
        count += keys.length;
      } catch {
        // Stockage indisponible : rien à effacer.
      }
    }
    return count;
  }

  /** Efface la valeur stockée. */
  remove() {
    try {
      this.#area.removeItem(this.#key);
    } catch {
      // Stockage indisponible : rien à effacer.
    }
  }
}
