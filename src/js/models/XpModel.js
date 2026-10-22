// Part de la page à parcourir pour terminer le « niveau » (la fin exacte est parfois inatteignable).
const COMPLETE = 0.98;

/**
 * Barre d'XP de lecture : avancement dans la page, de 0 à 1.
 * Émet « change » avec { progress, complete } et, une seule fois, « complete » en bas de page.
 */
export default class XpModel extends EventTarget {
  #progress = 0;
  #complete = false;

  /** @returns {{ progress: number, complete: boolean }} */
  get state() {
    return { progress: this.#progress, complete: this.#complete };
  }

  /** @param {number} progress Part de la page déjà parcourue, entre 0 et 1. */
  set(progress) {
    this.#progress = Math.min(Math.max(progress, 0), 1);
    const reached = !this.#complete && this.#progress >= COMPLETE;
    if (reached) this.#complete = true;
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
    if (reached) this.dispatchEvent(new Event('complete'));
  }
}
