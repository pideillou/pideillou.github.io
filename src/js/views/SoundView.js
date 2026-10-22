import { pickRandom } from '../utils/random.js';
// Rugissements : extraits de « t rex calls » de CaveboyTup (OpenGameArt, licence CC0),
// un montage de cris d'alligator, de lion et d'élan.
import rawrOneUrl from '../../assets/sounds/rawr-1.wav';
import rawrTwoUrl from '../../assets/sounds/rawr-2.wav';

// Notes du jingle du jackpot (Hz) : un arpège 8-bit montant. Durée d'une note (s).
const JINGLE = [523, 659, 784, 1047, 784, 1047, 1319];
const NOTE = 0.09;
const VOLUME = 0.05;
const RAWRS = [rawrOneUrl, rawrTwoUrl];
const RAWR_VOLUME = 0.7;

/**
 * Sons du site (Web Audio) : bips et jingle synthétisés, rugissements enregistrés.
 * Le navigateur n'autorise le son qu'après une action de l'utilisateur.
 */
export default class SoundView {
  #context = null;
  #rawrs = null;

  /** Charge les rugissements à l'avance, sans les jouer. */
  preloadRawr() {
    this.#loadRawrs().catch(() => {});
  }

  /** Rugissement de T-rex : un des enregistrements, à une hauteur un peu différente à chaque fois. */
  async rawr() {
    try {
      const context = this.#audio();
      const source = context.createBufferSource();
      source.buffer = pickRandom(await this.#loadRawrs());
      source.playbackRate.value = 0.88 + Math.random() * 0.24;
      const gain = context.createGain();
      gain.gain.value = RAWR_VOLUME;
      source.connect(gain).connect(context.destination);
      source.start();
    } catch {
      // Son indisponible : on reste silencieux.
    }
  }

  /** Court bip de confirmation. */
  blip() {
    this.#play([880], 0.08);
  }

  /** Jingle du jackpot, un peu moins d'une seconde. */
  jingle() {
    this.#play(JINGLE, NOTE);
  }

  #audio() {
    this.#context ??= new AudioContext();
    this.#context.resume();
    return this.#context;
  }

  // Téléchargés et décodés une seule fois ; en cas d'échec, on réessaiera au prochain clic.
  #loadRawrs() {
    this.#rawrs ??= Promise.all(
      RAWRS.map(async (url) => {
        const response = await fetch(url);
        return this.#audio().decodeAudioData(await response.arrayBuffer());
      }),
    ).catch((error) => {
      this.#rawrs = null;
      throw error;
    });
    return this.#rawrs;
  }

  /**
   * @param {number[]} notes
   * @param {number} duration Durée de chaque note (s).
   */
  #play(notes, duration) {
    try {
      const context = this.#audio();
      notes.forEach((frequency, index) => {
        const start = context.currentTime + index * duration;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(VOLUME, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
      });
    } catch {
      // Son indisponible (navigateur, réglages) : on reste silencieux.
    }
  }
}
