// Écart minimal entre deux rugissements (ms), pour ne pas saturer en cas de clics très rapides.
const RAWR_INTERVAL = 150;
// Rugissements d'affilée en mode dino avant la chute de la météorite (secret « extinction »).
const EXTINCTION_RAWRS = 10;

/**
 * Relie le curseur de la souris (et les appuis au doigt) à l'easter egg « dino ».
 * En mode dino, chaque clic ou appui fait rugir le T-rex (sauf si le visiteur a tapé « son off »).
 * Au dixième rugissement, la météorite tombe et le mode dino s'arrête.
 */
export default class CursorController {
  #lastRawr = 0;
  #rawrs = 0;
  #falling = false;

  /**
   * @param {import('../models/EasterEggModel.js').default} model
   * @param {import('../views/CursorView.js').default} view
   * @param {{ sound: import('../models/SoundModel.js').default,
   *   soundView: import('../views/SoundView.js').default,
   *   extinction: import('../views/ExtinctionView.js').default,
   *   onExtinction: () => void }} options
   */
  constructor(model, view, { sound, soundView, extinction, onExtinction }) {
    model.addEventListener('change', ({ detail }) => {
      view.render(detail);
      this.#rawrs = 0;
      // Les rugissements se chargent dès que le mode dino s'active : pas d'attente au premier clic.
      if (detail.active && !sound.muted) soundView.preloadRawr();
    });

    view.bindClick((x, y) => {
      if (!model.active || this.#falling) return;
      view.roar(x, y);
      this.#rawrs += 1;

      const now = performance.now();
      if (!sound.muted && now - this.#lastRawr >= RAWR_INTERVAL) {
        this.#lastRawr = now;
        soundView.rawr();
      }

      if (this.#rawrs < EXTINCTION_RAWRS) return;
      this.#falling = true;
      extinction
        .play({
          onImpact: () => {
            if (model.active) model.toggle();
            onExtinction();
          },
        })
        .finally(() => {
          this.#falling = false;
        });
    });
  }
}
