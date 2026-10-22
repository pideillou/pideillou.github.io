import { JACKPOT_BONUS } from '../models/TokenModel.js';

// Laisse la page apparaître avant l'explosion (ms).
const PAGE_DELAY = 250;

/**
 * Jackpot : offre des jetons et lance la grande célébration, le site passant en or
 * le temps de la fête, avec un jingle si le son est activé.
 * Si l'écran de chargement est ouvert, on attend sa fermeture.
 */
export default class JackpotController {
  #playing = false;

  /**
   * @param {import('../models/SlotMachineModel.js').default} slotMachine
   * @param {import('../views/JackpotView.js').default} view
   * @param {{ tokens: import('../models/TokenModel.js').default,
   *   theme: import('../models/ThemeModel.js').default,
   *   themeView: import('../views/ThemeView.js').default,
   *   sound: import('../models/SoundModel.js').default,
   *   soundView: import('../views/SoundView.js').default,
   *   target: HTMLElement | null,
   *   waitForPage: () => Promise<void> }} options
   */
  constructor(slotMachine, view, { tokens, theme, themeView, sound, soundView, target, waitForPage }) {
    slotMachine.addEventListener('spin', async ({ detail }) => {
      if (!detail.jackpot) return;
      tokens.grant(JACKPOT_BONUS);
      if (this.#playing) return;

      this.#playing = true;
      await waitForPage();
      await new Promise((resolve) => setTimeout(resolve, PAGE_DELAY));
      if (sound.on) soundView.jingle();
      if (view.enabled) {
        themeView.preview('or');
        await view.play({ skill: detail.result[0], bonus: JACKPOT_BONUS }, { target });
        // Retour au thème choisi par le visiteur.
        themeView.render({ theme: theme.current }, { animate: true });
      }
      this.#playing = false;
    });
  }
}
