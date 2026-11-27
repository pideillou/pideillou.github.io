// Règles communes sur le profil (src/data/profile.json), utilisées au build, dans le terminal et dans l'aperçu.

/**
 * Adresse du CV à afficher : vide si aucun CV n'est déposé ou si l'interrupteur « CV visible »
 * du back-office est coupé (cvVisible: false). Sans ce champ, le CV déposé reste visible.
 * @param {{ cv?: string, cvVisible?: boolean }} profile
 * @returns {string}
 */
export const visibleCv = (profile) => (profile?.cvVisible === false ? '' : profile?.cv || '');

/**
 * Formation découpée en diplôme et année : « BUT MMI, 2e année » donne { degree: 'BUT MMI', year: '2e année' }.
 * Sans virgule, tout est dans degree.
 * @param {string} school
 * @returns {{ degree: string, year: string }}
 */
export function splitSchool(school = '') {
  const [degree, ...rest] = String(school).split(',');
  return { degree: degree.trim(), year: rest.join(',').trim() };
}
