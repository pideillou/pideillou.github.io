// Fonctions pures de calcul de contraste (WCAG 2).

/**
 * @param {string} hex Couleur au format #rgb ou #rrggbb.
 * @returns {number} Luminance relative entre 0 et 1.
 */
function luminance(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((char) => char + char).join('') : value;
  const [r, g, b] = [0, 2, 4]
    .map((index) => parseInt(full.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Rapport de contraste entre deux couleurs.
 * @param {string} first
 * @param {string} second
 * @returns {number} Entre 1 et 21.
 */
export function contrastRatio(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
