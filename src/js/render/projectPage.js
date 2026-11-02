// Fiche projet : le HTML d'une page /projets/<slug>/, fabriqué depuis src/data/projects.json.
// Le contenu est donc dans le HTML servi (référencement) ; le JS de la page (src/project.js)
// ajoute le thème, le dino et le sommaire actif.
// Fabriqué au build (build/projectPages.js) et refait dans l'aperçu du back-office (src/js/preview.js).
import { COVER_VIEWBOX, coverShapes } from '../utils/coverArt.js';
import { projectContext } from '../utils/projectContext.js';
import { escape, pad } from './html.js';

export const SITE_URL = 'https://pideillou.github.io';
const AUTHOR = 'Paul PIDEILL';

// Textes guides des fiches sans étude de cas (projets d'exemple) : ils disent quoi écrire.
const GUIDE_SECTIONS = [
  {
    label: 'Contexte',
    title: 'Le point de départ',
    paragraphs: ['Texte d’exemple. Explique d’où part le projet : le cadre (cours, SAÉ, client ou projet perso), la demande et la contrainte principale.'],
  },
  {
    label: 'Objectifs',
    title: 'Ce qu’il fallait réussir',
    paragraphs: ['Texte d’exemple. Donne deux ou trois objectifs concrets, si possible mesurables.'],
  },
  {
    label: 'Mon rôle',
    title: 'Ma part du travail',
    paragraphs: ['Texte d’exemple. Précise la taille de l’équipe et ce que tu as fait toi-même.'],
  },
  {
    label: 'Conception',
    title: 'Une méthode en quatre temps',
    paragraphs: ['Texte d’exemple. Décris les grandes étapes et un choix dont tu es fier.'],
    steps: [{ title: 'Cadrer' }, { title: 'Explorer' }, { title: 'Prototyper' }, { title: 'Tester' }],
  },
  {
    label: 'Résultat',
    title: 'Ce que ça a donné',
    paragraphs: ['Texte d’exemple. Commence par le résultat, avec un chiffre ou un retour si tu en as un.'],
  },
];

// Titre échappé où les mots composés (« Royaume-Uni ») ne se coupent pas au trait d'union : la police pixel
// n'a pas de trait d'union insécable, on garde donc le mot entier sur une ligne.
const keepCompounds = (text) => escape(text).replace(/\S+-\S+/g, (word) => `<span class="whitespace-nowrap">${word}</span>`);
// Ancre à partir d'un libellé : « Mon rôle » devient « mon-role ».
const anchor = (label) =>
  label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Classes répétées dans la page.
const EYEBROW = 'flex items-center gap-4 font-mono text-xs font-semibold tracking-widest text-accent uppercase';
const EYEBROW_LINE = '<span class="h-px w-8 bg-accent" aria-hidden="true"></span>';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Projets triés du plus récent au plus ancien, avec leur libellé de catégorie.
 * @param {{ projects: object[], categories: { id: string, label: string }[] }} data projects.json remis en forme.
 */
export function sortProjects({ projects, categories }) {
  return [...projects]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((project) => ({ ...project, label: categories.find(({ id }) => id === project.category)?.label ?? project.category }));
}

export const pageUrl = (base, slug) => `${base}projets/${slug}/`;

function svg({ tag, attributes, className, children = [] }) {
  const attrs = Object.entries(attributes).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
  return `<${tag}${attrs}${className ? ` class="${className}"` : ''}>${children.map(svg).join('')}</${tag}>`;
}

function renderCover(project, base) {
  const { cover } = project;
  if (!cover) {
    return `<svg viewBox="${COVER_VIEWBOX}" preserveAspectRatio="xMidYMid slice" class="size-full" aria-hidden="true">${coverShapes(project).map(svg).join('')}</svg>`;
  }
  const url = (src) => (/^(?:[a-z]+:|\/)/i.test(src) ? src : `${base}${src}`);
  const srcset = cover.srcset?.length
    ? ` srcset="${escape(cover.srcset.map(({ src, width }) => `${url(src)} ${width}w`).join(', '))}" sizes="(min-width: 72rem) 72rem, 100vw"`
    : '';
  // Image principale de la page : chargée tout de suite (pas de lazy), en priorité.
  return `<img src="${escape(url(cover.src))}"${srcset} alt="${escape(cover.alt)}" width="${cover.width}" height="${cover.height}" fetchpriority="high" class="size-full object-cover object-top">`;
}

function renderSection(section, index, isLast, project) {
  const id = anchor(section.label);
  const paragraphs = (section.paragraphs ?? [])
    .map((text) => `<p class="mt-5 max-w-2xl text-lg leading-relaxed text-muted">${escape(text)}</p>`)
    .join('');
  const steps = section.steps?.length
    ? `<ol class="mt-8 grid gap-px overflow-hidden rounded-lg border border-muted/30 bg-muted/30 sm:grid-cols-2 lg:grid-cols-4">${section.steps
        .map(
          (step, i) =>
            `<li class="bg-surface p-6"><span class="font-mono text-2xs font-semibold text-accent">${pad(i + 1)}</span><h3 class="mt-2 font-semibold text-ink">${escape(step.title)}</h3>${
              step.text ? `<p class="mt-2 text-sm leading-relaxed text-muted">${escape(step.text)}</p>` : ''
            }</li>`,
        )
        .join('')}</ol>`
    : '';
  const links = isLast
    ? project.links
        .map(
          ({ label, url }) =>
            `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-12 items-center gap-3 rounded-md border border-muted/40 px-6 font-semibold text-ink transition-colors hover:border-accent hover:text-accent ${FOCUS}">${escape(label)}<span class="sr-only"> (nouvel onglet)</span><svg class="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5"/></svg></a>`,
        )
        .join('')
    : '';
  return `
          <section id="${id}" aria-labelledby="${id}-title" class="scroll-mt-8 border-b border-muted/20 py-14 first:pt-0 last:border-b-0">
            <p class="${EYEBROW}">${EYEBROW_LINE}${pad(index + 1)} / ${escape(section.label)}</p>
            <h2 id="${id}-title" class="mt-5 font-display text-3xl leading-tight sm:text-4xl">${escape(section.title)}</h2>
            ${paragraphs}${steps}${links ? `<p class="mt-8 flex flex-wrap gap-3">${links}</p>` : ''}
          </section>`;
}

function renderNeighbour(project, direction, base) {
  const next = direction === 'next';
  return `<a href="${pageUrl(base, project.slug)}" data-transition="${next ? 'next' : 'previous'}" class="group flex flex-col gap-2 bg-surface py-10 ${next ? 'sm:items-end sm:pl-8 sm:text-right' : 'sm:pr-8'} ${FOCUS}">
          <span class="font-mono text-xs tracking-widest text-muted uppercase">${next ? 'Projet suivant →' : '← Projet précédent'}</span>
          <span class="font-display text-2xl text-ink transition-colors group-hover:text-accent sm:text-3xl">${escape(project.title)}</span>
        </a>`;
}

/** Contenu de <body> d'une fiche projet. */
export function renderBody(project, projects, base) {
  const index = projects.indexOf(project);
  const previous = projects.at(index - 1);
  const next = projects[(index + 1) % projects.length];
  const study = project.caseStudy ?? {};
  const sections = study.sections?.length ? study.sections : GUIDE_SECTIONS;
  const caption = study.caption ?? (project.cover ? 'Interface principale' : 'Visuel provisoire');
  const context = projectContext(project.context);
  const meta = [
    ...(context ? [['Cadre', context.long]] : []),
    ['Année', project.date.slice(0, 4)],
    ['Rôle', project.role],
    ['Durée', study.duration ?? 'À préciser'],
  ];

  return `
  <a href="#contenu" class="sr-only rounded-full bg-accent px-4 py-2 font-semibold text-surface focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50">Aller au contenu</a>

  <header class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-6 md:px-8">
    <a href="${base}" data-transition="back" class="flex items-center gap-3 rounded-full pr-2 ${FOCUS}">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-initials text-lg font-bold text-surface" aria-hidden="true">Pp</span>
      <span class="font-display font-bold whitespace-nowrap">${AUTHOR}</span>
    </a>
    <a href="${base}#tous-les-projets" data-transition="back" class="group inline-flex min-h-11 items-center gap-2 rounded-full border border-muted/40 px-3 text-sm font-semibold whitespace-nowrap text-ink sm:px-4 transition-colors hover:border-accent hover:text-accent ${FOCUS}">
      <svg class="size-4 motion-safe:transition-transform motion-safe:group-hover:-translate-x-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 8H2M7 3L2 8l5 5"/></svg>
      <span class="sm:hidden">Projets</span><span class="hidden sm:inline">Tous les projets</span>
    </a>
  </header>

  <main id="contenu" class="mx-auto max-w-6xl px-4 md:px-8">
    <article data-level="${escape(project.slug)}" data-levels="${escape(projects.map(({ slug }) => slug).join(' '))}" data-next-level="${escape(next.slug)}" data-next-title="${escape(next.title)}">
      <header data-enter class="grid gap-10 pt-16 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end lg:gap-16">
        <div>
          <p class="${EYEBROW}">${EYEBROW_LINE}Étude de cas / ${escape(study.kicker ?? project.label)}</p>
          <h1 class="mt-6 font-display text-5xl leading-none tracking-tight text-balance sm:text-6xl lg:text-7xl">${keepCompounds(project.title)}${
            study.titleAccent ? ` <span class="block text-accent italic">${keepCompounds(study.titleAccent)}</span>` : ''
          }</h1>
        </div>
        <div>
          <p class="text-lg leading-relaxed text-muted">${escape(study.intro ?? project.summary)}</p>
          <dl class="mt-8 grid grid-cols-2 gap-6 border-t border-muted/30 pt-6">
            ${meta
              .map(
                ([term, value]) =>
                  `<div><dt class="font-mono text-2xs tracking-widest text-muted uppercase">${term}</dt><dd class="mt-2 text-sm font-semibold uppercase">${escape(value)}</dd></div>`,
              )
              .join('\n            ')}
          </dl>
        </div>
      </header>
${
  project.example
    ? `
      <p class="mb-8 border-l-2 border-accent pl-4 text-sm text-muted">Projet d’exemple : cette fiche montre la mise en page. Les textes sont à remplacer par une vraie réalisation.</p>
`
    : ''
}
      <figure data-hero class="relative aspect-16/10 overflow-hidden rounded-lg border border-muted/30 bg-ink/5 md:aspect-2/1">
        ${renderCover(project, base)}
        <figcaption class="absolute bottom-4 left-4 rounded bg-surface/90 px-3 py-2 font-mono text-2xs font-semibold tracking-widest text-accent uppercase">01 / ${escape(caption)}</figcaption>
      </figure>

      <div data-enter class="grid gap-12 py-20 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-20">
        <nav data-toc aria-labelledby="sommaire-title" class="lg:sticky lg:top-8 lg:self-start">
          <h2 id="sommaire-title" class="border-t border-muted/30 pt-4 font-mono text-2xs font-normal tracking-widest text-muted uppercase">Sommaire</h2>
          <ol class="mt-2">
            ${sections
              .map(
                (section, i) =>
                  `<li><a href="#${anchor(section.label)}" class="group flex min-h-11 items-center gap-4 border-b border-muted/20 text-sm text-muted transition-colors hover:text-ink aria-[current=location]:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"><span class="font-mono text-2xs group-aria-[current=location]:text-accent" aria-hidden="true">${pad(i + 1)}</span>${escape(section.label)}</a></li>`,
              )
              .join('\n            ')}
          </ol>
        </nav>

        <div>${sections.map((section, i) => renderSection(section, i, i === sections.length - 1, project)).join('')}
        </div>
      </div>

      <nav data-enter aria-label="Autres projets" class="grid gap-px border-y border-muted/30 bg-muted/30 sm:grid-cols-2">
        ${renderNeighbour(previous, 'previous', base)}
        ${renderNeighbour(next, 'next', base)}
      </nav>
    </article>
  </main>

  <footer class="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-10 font-mono text-xs text-muted md:px-8">
    <a href="${base}" data-transition="back" class="rounded underline decoration-accent underline-offset-4 hover:text-ink ${FOCUS}">Retour à l’accueil</a>
    <a href="${base}mentions-legales/" class="rounded underline decoration-accent underline-offset-4 hover:text-ink ${FOCUS}">Mentions légales</a>
  </footer>
`;
}

/**
 * Balises de <head> propres à la fiche : référencement, partage, données structurées.
 * L'image de partage est celle de l'accueil (src/data/seo.json), en PNG car LinkedIn et WhatsApp affichent mal le WebP.
 */
export function renderHead(project, base, seo) {
  const url = `${SITE_URL}${pageUrl(base, project.slug)}`;
  const title = `${project.title} : étude de cas | ${AUTHOR}`;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.summary,
        url,
        inLanguage: 'fr',
        dateCreated: project.date,
        keywords: project.stack.join(', '),
        author: { '@type': 'Person', name: AUTHOR, url: `${SITE_URL}${base}` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}${base}` },
          { '@type': 'ListItem', position: 2, name: 'Projets', item: `${SITE_URL}${base}#tous-les-projets` },
          { '@type': 'ListItem', position: 3, name: project.title, item: url },
        ],
      },
    ],
  };
  return {
    title,
    head: `<link rel="canonical" href="${url}">
  <meta name="robots" content="${project.example ? 'noindex, follow' : 'index, follow'}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(project.summary)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:image" content="${SITE_URL}${base}${escape(seo.image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escape(seo.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="speculationrules">${JSON.stringify({ prefetch: [{ where: { href_matches: `${base}*` }, eagerness: 'moderate' }] })}</script>
  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
  };
}

/** Remplit le gabarit projet.html pour un projet. */
export function renderPage(template, project, projects, base, seo) {
  const { title, head } = renderHead(project, base, seo);
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(project.summary)}">`)
    .replace('<!-- project:head -->', head)
    .replace('<!-- project:body -->', renderBody(project, projects, base));
}

