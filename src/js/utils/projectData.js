// Données des projets (src/data/projects.json), remises en forme avant usage.
// Le fichier est modifié depuis le back-office (Sveltia CMS) : un visuel peut arriver
// sans dimensions, et un champ facultatif peut rester vide. On complète et on nettoie ici,
// au build (build/projectData.js) comme dans l'aperçu du back-office (src/js/preview.js).

// Retire les textes vides, pour que les valeurs par défaut des fiches s'appliquent.
const withoutEmpty = (object = {}) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== '' && value != null));

/**
 * Complète le visuel d'un projet avec sa largeur et sa hauteur.
 * Sans dimensions trouvées, le projet garde son illustration dessinée.
 */
function normalizeCover(cover, sizeOf, slug) {
  if (!cover?.src) return undefined;
  if (cover.width && cover.height) return { alt: '', ...cover };
  const size = sizeOf(cover.src);
  if (!size) {
    console.warn(`[projets] Visuel de « ${slug} » introuvable ou illisible : ${cover.src}. Illustration par défaut utilisée.`);
    return undefined;
  }
  return { alt: '', ...cover, ...size };
}

// Texte des boutons de l'ancien format de liens ({ demo, repo }), encore accepté.
const LEGACY_LINKS = { demo: 'Voir le site en ligne', repo: 'Voir le code' };

/**
 * Liens d'un projet : une liste de { label, url }, dans l'ordre des boutons.
 * Les liens sans adresse web (http ou https) sont écartés, ceux sans texte prennent « Voir le lien ».
 * @param {{ label?: string, url?: string }[] | Record<string, string> | undefined} links
 * @returns {{ label: string, url: string }[]}
 */
function normalizeLinks(links) {
  const list = Array.isArray(links)
    ? links
    : Object.entries(links ?? {}).map(([key, url]) => ({ label: LEGACY_LINKS[key], url }));
  return list
    .filter((link) => /^https?:\/\//.test(link?.url ?? ''))
    .map(({ label, url }) => ({ label: label?.trim() || 'Voir le lien', url }));
}

/**
 * @param {{ categories: object[], projects: object[] }} data Contenu brut de projects.json.
 * @param {(src: string) => { width: number, height: number } | null} sizeOf
 *   Dimensions d'un visuel sans largeur ni hauteur (lues dans le fichier au build).
 */
export function normalizeProjectData(data, sizeOf) {
  const projects = data.projects.map((project) => {
    const { cover, caseStudy, links, ...rest } = project;
    const study = caseStudy && withoutEmpty(caseStudy);
    const normalized = { ...rest, stack: project.stack ?? [], example: Boolean(project.example), links: normalizeLinks(links) };
    const image = normalizeCover(cover, sizeOf, project.slug);
    if (image) normalized.cover = image;
    if (study && Object.keys(study).length) normalized.caseStudy = study;
    return normalized;
  });
  return { ...data, projects };
}
