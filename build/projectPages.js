// Fiches projet : une page HTML par projet, fabriquée depuis src/data/projects.json
// (HTML : src/js/render/projectPage.js).
// En développement, la page est construite à chaque visite de /projets/<slug>/.
// Au build, elle est écrite dans dist/projets/<slug>/index.html, avec son titre, sa description,
// ses balises de partage et ses données structurées.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_URL, pageUrl, renderPage, sortProjects } from '../src/js/render/projectPage.js';
import { readProjectData } from './projectData.js';
import { renderLlmsTxt } from './llmsTxt.js';

const TEMPLATE = 'projet.html';

const readProjects = (root) => sortProjects(readProjectData(root));

// Image de partage des fiches : celle de l'accueil (src/data/seo.json).
const readJson = (root, name) => JSON.parse(readFileSync(resolve(root, `src/data/${name}.json`), 'utf8'));
const readSeo = (root) => readJson(root, 'seo');

function renderSitemap(projects, base) {
  // Les projets d'exemple ne sont pas indexés : ils n'entrent pas dans le plan du site.
  // Pas de <lastmod> : la date du build changerait à chaque fois, et Google ignore une date peu fiable.
  const urls = [base, ...projects.filter(({ example }) => !example).map(({ slug }) => pageUrl(base, slug))];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}
</urlset>
`;
}

/** Plugin Vite des fiches projet. */
export default function projectPages() {
  let config;
  return {
    name: 'portfolio-project-pages',

    configResolved(resolved) {
      config = resolved;
    },

    // Développement : /projets/<slug>/ renvoie la fiche, fabriquée à la volée.
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        const match = path.match(new RegExp(`^${config.base}projets/([a-z0-9-]+)(/?)$`));
        if (!match) return next();
        if (!match[2]) {
          res.writeHead(301, { Location: `${path}/` });
          return res.end();
        }
        const projects = readProjects(config.root);
        const project = projects.find(({ slug }) => slug === match[1]);
        if (!project) {
          res.statusCode = 404;
          return res.end('Projet introuvable');
        }
        const template = readFileSync(resolve(config.root, TEMPLATE), 'utf8');
        const html = await server.transformIndexHtml(req.url, renderPage(template, project, projects, config.base, readSeo(config.root)));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      });
    },

    // Build : une page par projet à partir du gabarit compilé, puis le plan du site et llms.txt.
    closeBundle() {
      if (config.command !== 'build') return;
      const outDir = resolve(config.root, config.build.outDir);
      const template = readFileSync(resolve(outDir, TEMPLATE), 'utf8');
      const projects = readProjects(config.root);
      const seo = readSeo(config.root);
      projects.forEach((project) => {
        const dir = resolve(outDir, 'projets', project.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'index.html'), renderPage(template, project, projects, config.base, seo));
      });
      rmSync(resolve(outDir, TEMPLATE));
      writeFileSync(resolve(outDir, 'sitemap.xml'), renderSitemap(projects, config.base));
      writeFileSync(
        resolve(outDir, 'llms.txt'),
        renderLlmsTxt({ seo, profile: readJson(config.root, 'profile'), contact: readJson(config.root, 'contact'), projects, base: config.base }),
      );
    },
  };
}
