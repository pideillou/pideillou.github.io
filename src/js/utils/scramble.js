import { pickRandom } from './random.js';

// Caractères tirés pendant le « décodage ».
const GLYPHS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_'];

/**
 * Renvoie le texte partiellement décodé : les premiers caractères sont les vrais,
 * les suivants sont tirés au hasard. Les espaces restent en place.
 * @param {string} text Texte final.
 * @param {number} progress Avancement entre 0 et 1.
 * @returns {string}
 */
export function scrambleText(text, progress) {
  const revealed = Math.floor(text.length * progress);
  return [...text]
    .map((char, index) => (index < revealed || char === ' ' ? char : pickRandom(GLYPHS)))
    .join('');
}
