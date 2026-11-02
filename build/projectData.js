// Données des projets (src/data/projects.json), remises en forme avant usage
// (règles : src/js/utils/projectData.js), pour les fiches projet (build/projectPages.js)
// comme pour le JS de l'accueil (plugin ci-dessous).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import imageSize from './imageSize.js';
import { normalizeProjectData } from '../src/js/utils/projectData.js';

export const DATA_FILE = 'src/data/projects.json';

// Largeur et hauteur d'un visuel, lues dans le fichier (dossier public/).
const sizeFromFile = (root) => (src) => {
  const file = resolve(root, 'public', src.replace(/^\//, ''));
  return existsSync(file) ? imageSize(file) : null;
};

/** Lit et remet en forme projects.json. */
export function readProjectData(root) {
  return normalizeProjectData(JSON.parse(readFileSync(resolve(root, DATA_FILE), 'utf8')), sizeFromFile(root));
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
      return { code: JSON.stringify(normalizeProjectData(JSON.parse(code), sizeFromFile(root))), map: null };
    },
  };
}
