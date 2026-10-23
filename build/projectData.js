// Données des projets (src/data/projects.json), remises en forme avant usage.
// Le fichier est modifié depuis le back-office (Sveltia CMS) : un visuel peut arriver
// sans dimensions, et un champ facultatif peut rester vide. On complète et on nettoie ici,
// pour les fiches projet (build/projectPages.js) comme pour le JS de l'accueil (plugin ci-dessous).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import imageSize from './imageSize.js';

export const DATA_FILE = 'src/data/projects.json';

// Retire les textes vides, pour que les valeurs par défaut des fiches s'appliquent.
const withoutEmpty = (object = {}) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== '' && value != null));

/**
 * Complète le visuel d'un projet : largeur et hauteur lues dans le fichier (dossier public/).
 * Sans fichier, le projet garde son illustration dessinée.
 */
function normalizeCover(cover, root, slug) {
  if (!cover?.src) return undefined;
  if (cover.width && cover.height) return { alt: '', ...cover };
  const file = resolve(root, 'public', cover.src.replace(/^\//, ''));
  const size = existsSync(file) ? imageSize(file) : null;
  if (!size) {
    console.warn(`[projets] Visuel de « ${slug} » introuvable ou illisible : ${cover.src}. Illustration par défaut utilisée.`);
    return undefined;
  }
  return { alt: '', ...cover, ...size };
}

/**
 * @param {{ categories: object[], projects: object[] }} data Contenu brut de projects.json.
 * @param {string} root Racine du projet.
 */
export function normalizeProjectData(data, root) {
  const projects = data.projects.map((project) => {
    const { cover, caseStudy, links, ...rest } = project;
    const study = caseStudy && withoutEmpty(caseStudy);
    const normalized = { ...rest, stack: project.stack ?? [], example: Boolean(project.example), links: withoutEmpty(links) };
    const image = normalizeCover(cover, root, project.slug);
    if (image) normalized.cover = image;
    if (study && Object.keys(study).length) normalized.caseStudy = study;
    return normalized;
  });
  return { ...data, projects };
}

/** Lit et remet en forme projects.json. */
export function readProjectData(root) {
  return normalizeProjectData(JSON.parse(readFileSync(resolve(root, DATA_FILE), 'utf8')), root);
}

/** Plugin Vite : le JS de l'accueil importe projects.json déjà remis en forme. */
export default function projectData() {
  let root;
  return {
    name: 'portfolio-project-data',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    transform(code, id) {
      if (!id.split('?')[0].replaceAll('\\', '/').endsWith(DATA_FILE)) return null;
      return { code: JSON.stringify(normalizeProjectData(JSON.parse(code), root)), map: null };
    },
  };
}
