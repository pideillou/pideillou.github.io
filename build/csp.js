// Politique de sécurité du contenu (CSP) : le navigateur ne charge que ce que cette liste autorise.
// Un script injecté dans la page (faille XSS) ne pourrait donc ni s'exécuter ni envoyer de données ailleurs.
// GitHub Pages n'accepte pas d'en-têtes HTTP : la CSP est une balise <meta>, ajoutée au build seulement
// (en développement, Vite injecte des styles en ligne qu'elle bloquerait).
// Limites de la balise <meta> : frame-ancestors (affichage dans un cadre) et report-uri ne sont pas pris en compte.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Origine du service de formulaire (contact.json), seule adresse extérieure contactée par le site. */
function formOrigin(root) {
  try {
    const { endpoint } = JSON.parse(readFileSync(resolve(root, 'src/data/contact.json'), 'utf8'));
    return /^https:\/\//.test(endpoint ?? '') ? new URL(endpoint).origin : '';
  } catch {
    return '';
  }
}

/**
 * Empreintes des règles de préchargement (<script type="speculationrules">) de la page :
 * seuls scripts en ligne permis, et seulement avec ce contenu exact. Ce ne sont pas du code, juste du JSON.
 */
const speculationHashes = (html) =>
  [...html.matchAll(/<script type="speculationrules">([\s\S]*?)<\/script>/g)].map(
    ([, content]) => `'sha256-${createHash('sha256').update(content).digest('base64')}'`,
  );

/**
 * @param {string} html Page terminée.
 * @param {string} form Origine du service de formulaire, ou vide.
 */
export function csp(html, form) {
  return [
    "default-src 'self'",
    ["script-src 'self'", ...speculationHashes(html)].join(' '),
    "style-src 'self'",
    // data: pour les curseurs dessinés en CSS, blob: pour les visuels pas encore enregistrés dans l'aperçu du back-office.
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self'",
    `connect-src 'self'${form ? ` ${form}` : ''}`,
    // mailto: pour l'envoi de secours par la messagerie du visiteur.
    `form-action 'self'${form ? ` ${form}` : ''} mailto:`,
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** Toutes les pages HTML d'un dossier, sous-dossiers compris (sauf admin/ : Sveltia charge son script depuis unpkg). */
const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'admin' ? [] : htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

/**
 * Plugin Vite : tout à la fin du build (order: 'post', après les fiches projet écrites par build/projectPages.js),
 * ajoute la CSP juste après <meta charset> de chaque page, avant tout script ou style.
 */
export default function cspMeta() {
  let config;
  return {
    name: 'portfolio-csp',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        const form = formOrigin(config.root);
        htmlFiles(resolve(config.root, config.build.outDir)).forEach((file) => {
          const html = readFileSync(file, 'utf8');
          if (html.includes('http-equiv="Content-Security-Policy"')) return;
          const withCsp = html.replace(
            /<meta charset="utf-8">/i,
            (charset) => `${charset}\n  <meta http-equiv="Content-Security-Policy" content="${csp(html, form)}">`,
          );
          writeFileSync(file, withCsp);
        });
      },
    },
  };
}
