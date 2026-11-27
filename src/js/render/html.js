// Petits outils des fonctions de rendu HTML (dossier src/js/render/), utilisés au build
// et dans l'aperçu du back-office.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe un texte avant de l'insérer dans du HTML. */
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char]);

/**
 * Adresse web venue des données, gardée seulement si elle commence par https://.
 * Bloque les liens « javascript: » ou « data: », qui exécuteraient du code au clic.
 * @param {unknown} url
 * @returns {string} L'adresse, ou une chaîne vide.
 */
export const safeUrl = (url) => {
  const value = String(url ?? '').trim();
  return /^https:\/\//i.test(value) ? value : '';
};

/** Numéro sur deux chiffres : 1 devient « 01 ». */
export const pad = (number) => String(number).padStart(2, '0');
