/**
 * Effet de décodage des petits textes techniques : à l'arrivée sur la page et au survol.
 * Désactivé si l'utilisateur a demandé moins d'animations.
 */
export default class ScrambleController {
  #view;
  #enabled;

  /**
   * @param {import('../views/ScrambleView.js').default} view
   * @param {{ reducedMotion: boolean }} options
   */
  constructor(view, { reducedMotion }) {
    this.#view = view;
    this.#enabled = !reducedMotion;
    if (this.#enabled) view.bindHover((element) => view.play(element));
  }

  /** Lance le décodage de tous les textes (une fois la page visible). */
  start() {
    if (this.#enabled) this.#view.playAll();
  }
}
