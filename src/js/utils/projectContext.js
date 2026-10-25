// Cadre d'un projet : perso, école (SAé, cours) ou pro (client, stage, alternance).
// Libellés communs aux cartes de l'accueil (ProjectModel) et aux fiches projet (build/projectPages.js).
const CONTEXTS = {
  perso: { short: 'Perso', long: 'Projet personnel' },
  ecole: { short: 'École', long: 'Projet d’école' },
  pro: { short: 'Pro', long: 'Projet professionnel' },
};

/**
 * @param {string | undefined} id Cadre du projet (« perso », « ecole » ou « pro »).
 * @returns {{ short: string, long: string } | null} Libellés, ou null si le cadre n'est pas renseigné.
 */
export const projectContext = (id) => CONTEXTS[id] ?? null;
