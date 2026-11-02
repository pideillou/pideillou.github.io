// Aperçu du back-office : ce qui vient d'être modifié dans un fichier de src/data/.

/**
 * Textes (et adresses) nouveaux ou changés entre deux versions d'un contenu JSON,
 * comparés au même emplacement. Un texte vidé ou supprimé n'y figure pas : il n'y a rien à montrer.
 * @param {unknown} before Version précédente.
 * @param {unknown} after Version modifiée.
 * @returns {string[]} Valeurs de la version modifiée, dans l'ordre du fichier.
 */
export function changedTexts(before, after) {
  if (typeof after === 'string') return after.trim() && after !== before ? [after.trim()] : [];
  if (after === null || typeof after !== 'object') return [];
  const previous = before !== null && typeof before === 'object' ? before : {};
  return Object.entries(after).flatMap(([key, value]) => changedTexts(previous[key], value));
}
