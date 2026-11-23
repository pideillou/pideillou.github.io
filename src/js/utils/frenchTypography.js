// Typographie française appliquée aux textes affichés, au build (escape) et dans le navigateur
// (FrenchTypographyView). Les JSON restent tels que le back-office les écrit.
// - espace insécable avant : ; ! ? » et après « (le signe ne part jamais seul à la ligne) ;
// - apostrophe typographique ’ entre deux lettres (j'ai devient j’ai).

const NBSP = ' ';
const BEFORE = / ([:;!?»])/g;
const AFTER = /« /g;
const APOSTROPHE = /(\p{L})'(\p{L})/gu;

/** Vrai si le texte contient quelque chose à corriger (évite de réécrire le DOM pour rien). */
export const needsFrenchTypography = (text) => / [:;!?»]|« |\p{L}'\p{L}/u.test(text);

/** Renvoie le texte avec les espaces insécables et les apostrophes typographiques. */
export const frenchTypography = (text) =>
  String(text ?? '')
    .replace(BEFORE, `${NBSP}$1`)
    .replace(AFTER, `«${NBSP}`)
    .replace(APOSTROPHE, '$1’$2');
