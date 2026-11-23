// llms.txt : résumé du site en Markdown pour les assistants IA (format proposé sur https://llmstxt.org/).
// Écrit au build dans dist/llms.txt par build/projectPages.js, à partir des mêmes JSON que le site.
import { SITE_URL, pageUrl } from '../src/js/render/projectPage.js';
import { projectContext } from '../src/js/utils/projectContext.js';

// Retours à la ligne retirés : une entrée de liste Markdown tient sur une ligne.
const oneLine = (text = '') => String(text).replace(/\s+/g, ' ').trim();

/**
 * @param {{ seo: { title: string, description: string }, profile: object, contact: { links?: { label: string, url: string }[] },
 *   projects: object[], base: string }} data
 *   projects : triés du plus récent au plus ancien, avec le nom de leur catégorie (sortProjects).
 * @returns {string}
 */
export function renderLlmsTxt({ seo, profile, contact, projects, base }) {
  const home = `${SITE_URL}${base}`;
  const skills = [...(profile.dev ?? []), ...(profile.design ?? [])].join(', ');

  // Les projets d'exemple ne sont pas indexés (noindex) : ils restent hors du résumé, comme du plan du site.
  const projectLines = projects
    .filter(({ example }) => !example)
    .map((project) => {
      const meta = [project.label, projectContext(project.context)?.long, project.date].filter(Boolean).join(', ');
      return `- [${oneLine(project.title)}](${SITE_URL}${pageUrl(base, project.slug)}): ${oneLine(project.summary)} (${meta})`;
    });

  const links = [
    `- [Portfolio](${home}): page d’accueil, projets, parcours et formulaire de contact`,
    ...(profile.cv ? [`- [CV (PDF)](${SITE_URL}${profile.cv})`] : []),
    ...(contact.links ?? []).map(({ label, url }) => `- [${oneLine(label)}](${url})`),
  ];

  return `# ${oneLine(profile.name)}

> ${oneLine(seo.description)}

${oneLine(profile.name)} : ${oneLine(profile.school)}, ${oneLine(profile.institution)} (${oneLine(profile.city)}).
Compétences : ${skills}.
Pour le contacter : formulaire de la section Contact sur ${home}#contact.

## Projets

${projectLines.join('\n')}

## Liens

${links.join('\n')}
`;
}
