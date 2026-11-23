// Petits outils des fonctions de rendu HTML (dossier src/js/render/), utilisés au build
// et dans l'aperçu du back-office.

import { frenchTypography } from '../utils/frenchTypography.js';

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe un texte avant de l'insérer dans du HTML, avec la typographie française (insécables, ’). */
export const escape = (value) => frenchTypography(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);

/** Numéro sur deux chiffres : 1 devient « 01 ». */
export const pad = (number) => String(number).padStart(2, '0');
