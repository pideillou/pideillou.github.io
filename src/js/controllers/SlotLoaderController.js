// Temps laissé pour lire et entendre le résultat avant la fermeture (ms).
const RESULT_DELAY = 1800;
// Plus long en cas de jackpot, pour profiter de l'animation (ms).
// La grande célébration prend le relais sur la page (JackpotController).
const JACKPOT_DELAY = 2600;

/**
 * Orchestre l'écran de chargement : à chaque chargement de la page,
 * jamais si l'utilisateur a demandé moins d'animations.
 */
export default class SlotLoaderController {
  #model;
  #view;
  #reducedMotion;
  #opened = false;
  #closed = false;

  /**
   * @param {import('../models/SlotMachineModel.js').default} model
   * @param {import('../views/SlotLoaderView.js').default} view
   * @param {{ reducedMotion: boolean }} options
   */
  constructor(model, view, { reducedMotion }) {
    this.#model = model;
    this.#view = view;
    this.#reducedMotion = reducedMotion;

    model.addEventListener('spin', (event) => this.#onSpin(event.detail));
    view.bindSkip(() => this.#close());
  }

  /** Lance l'écran de chargement si les conditions sont réunies. */
  start() {
    if (this.#reducedMotion || !this.#model.canSpin) return;

    this.#opened = true;
    this.#view.open();
    this.#model.spin();
  }

  /** @param {{ reels: string[][], result: string[], jackpot: boolean }} detail */
  async #onSpin({ reels, result, jackpot }) {
    // Les autres tirages (relance depuis la page, animations réduites) n'animent pas l'écran de chargement.
    if (!this.#opened || this.#closed) return;
    const finished = await this.#view.spin(reels);
    if (!finished || this.#closed) return;

    if (jackpot) {
      this.#view.celebrate(result[0]);
      setTimeout(() => this.#close(), JACKPOT_DELAY);
    } else {
      this.#view.announce(result);
      setTimeout(() => this.#close(), RESULT_DELAY);
    }
  }

  #close() {
    if (this.#closed) return;
    this.#closed = true;
    this.#view.close();
  }
}
