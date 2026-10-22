// Fonctions pures de tirage au sort.

/**
 * Renvoie une copie mélangée du tableau (algorithme de Fisher-Yates).
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Générateur aléatoire « à graine » (mulberry32) : la même graine donne toujours
 * la même suite de nombres. Sert à dessiner la même illustration à chaque visite.
 * @param {string} seed
 * @returns {() => number} Fonction qui renvoie un nombre entre 0 et 1.
 */
export function seededRandom(seed) {
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Renvoie un élément pris au hasard dans le tableau.
 * @template T
 * @param {T[]} items
 * @returns {T}
 */
export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}
