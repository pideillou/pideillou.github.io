// Fabrique de plugins Vite : remplace un commentaire d'index.html par une section
// construite depuis des fichiers JSON, au build comme en développement.
// Le contenu est ainsi dans le HTML servi (lisible sans JavaScript, bon pour le référencement),
// tout en restant modifiable dans src/data/ (et plus tard depuis le back office).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe un texte avant de l'insérer dans du HTML. */
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ENTITIES[char]);

/** Numéro sur deux chiffres : 1 devient « 01 ». */
export const pad = (number) => String(number).padStart(2, '0');

/**
 * @param {{ name: string, placeholder: string, files: Record<string, string>,
 *   render: (data: Record<string, any>) => string }} options
 *   files : fichiers JSON à lire, par nom (ex. { education: 'src/data/education.json' }).
 */
export default function htmlSection({ name, placeholder, files, render }) {
  let root;
  const read = () =>
    Object.fromEntries(Object.entries(files).map(([key, file]) => [key, JSON.parse(readFileSync(resolve(root, file), 'utf8'))]));

  return {
    name,

    configResolved(config) {
      root = config.root;
    },

    // Développement : recharge la page quand un des fichiers de données change.
    configureServer(server) {
      const watched = Object.values(files).map((file) => resolve(root, file));
      server.watcher.add(watched);
      server.watcher.on('change', (path) => {
        if (watched.includes(resolve(path))) server.ws.send({ type: 'full-reload' });
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.includes(placeholder) ? html.replace(placeholder, render(read())) : html;
      },
    },
  };
}
