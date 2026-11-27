// Textes de l'accueil modifiables depuis le back-office (fichier src/data/home.json, « Accueil et disponibilité »),
// fabriqués à la place des commentaires <!-- home:… --> d'index.html.
// Chaque morceau a un attribut data-home : l'aperçu du back-office le retrouve et le remplace.
// Un morceau masqué (disponibilité, citation) reste dans la page, vide et caché, pour que l'aperçu le retrouve.
// Fabriqué au build (build/homeSection.js) et refait dans l'aperçu du back-office (src/js/preview.js).
import { escape } from './html.js';
import { splitSchool } from '../utils/profile.js';

// Pastille verte qui clignote, devant « Ouvert aux opportunités ».
// Classes écrites en entier : Tailwind ne repère pas une classe fabriquée par morceaux.
const DOTS = {
  small: ['size-2', 'shadow-[0_0_8px_var(--color-online)]'],
  large: ['size-2.5', 'shadow-[0_0_10px_var(--color-online)]'],
};
const dot = (kind) => {
  const [size, glow] = DOTS[kind];
  return `<span class="relative flex ${size}" aria-hidden="true">
              <span class="absolute size-full rounded-full bg-online opacity-75 motion-safe:animate-ping"></span>
              <span class="relative ${size} rounded-full bg-online ${glow}"></span>
            </span>`;
};

const isOn = (block) => Boolean(block?.visible && String(block.label ?? block.text ?? '').trim());

/** Disponibilité et horloge dans l'en-tête (cachées sur tablette, où la place manque). */
function renderNavStatus({ home, profile }) {
  const city = String(profile.city ?? '').split(',')[0].trim();
  const status = isOn(home.availability)
    ? `
          <span class="flex items-center gap-2 text-ink">
            ${dot('small')}
            ${escape(home.availability.label)}
          </span>`
    : '';
  return `<p data-home="nav-status" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-xs text-muted md:hidden lg:flex lg:border-l lg:border-muted/30 lg:pr-2 lg:pl-6">${status}
          <span>${escape(city)} <span data-clock data-timezone="Europe/Paris" class="tabular-nums"></span></span>
        </p>`;
}

/** Pastille « Ouvert aux opportunités » en haut de l'accueil. */
function renderStatus({ home }) {
  if (!isOn(home.availability)) return '<p data-home="status" hidden></p>';
  return `<p data-home="status" class="inline-flex w-fit items-center gap-2.5 rounded-full border border-online/40 bg-online/10 px-4 py-2 text-xs tracking-widest text-ink uppercase">
          ${dot('large')}
          ${escape(home.availability.label)}
        </p>`;
}

/** Citation : sous le nom sur mobile, en haut à droite sur desktop. */
function renderQuote({ home }) {
  const { quote } = home;
  if (!isOn(quote)) return '<div data-home="quote" hidden></div>';
  const author = String(quote.author ?? '').trim();
  return `<figure data-home="quote" class="relative order-last max-w-sm pl-9 lg:order-0 lg:col-start-2 lg:row-start-1 lg:mt-2">
          <span class="absolute -top-2 left-0 font-display text-6xl leading-none text-accent" aria-hidden="true">«</span>
          <blockquote>
            <p class="font-lead text-lg leading-snug text-ink italic sm:text-xl">${escape(quote.text)}<span class="font-display text-accent not-italic" aria-hidden="true">&#x202F;»</span></p>
          </blockquote>${
            author
              ? `
          <figcaption class="mt-3 flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase">
            <span class="h-px w-6 bg-accent" aria-hidden="true"></span>
            ${escape(author)}
          </figcaption>`
              : ''
          }
        </figure>`;
}

/** Phrase d'accroche : « Étudiant en 2e année de BUT MMI. » + texte libre. Année et diplôme viennent du Profil. */
function renderLead({ home, profile }) {
  const { degree, year } = splitSchool(profile.school);
  const url = String(home.lead?.schoolUrl ?? '');
  const school = /^https:\/\//.test(url)
    ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" class="underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">${escape(degree)}<span class="sr-only"> (nouvel onglet)</span></a>`
    : escape(degree);
  const text = String(home.lead?.text ?? '').trim();
  return `<p data-home="lead" class="font-lead text-xl leading-snug sm:text-2xl">Étudiant en ${year ? `${escape(year)} de ` : ''}${school}.${text ? ` ${escape(text)}` : ''}</p>`;
}

function renderTagline({ home }) {
  return `<p data-home="tagline" class="border-l border-accent pl-4 text-sm leading-relaxed text-muted md:col-span-2 lg:col-span-1">${escape(home.tagline)}</p>`;
}

/** Infos en police mono, « décodées » à l'arrivée et au survol (src/js/views/ScrambleView.js). */
function renderFacts({ home, profile }) {
  const sep = '\n        <span class="h-px w-8 bg-muted/50" aria-hidden="true"></span>\n        ';
  const facts = [profile.city, home.coordinates, home.focus]
    .map((fact) => String(fact ?? '').trim())
    .filter(Boolean)
    .map((fact) => `<span data-scramble>${escape(fact)}</span>`);
  return `<p data-home="facts" class="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted uppercase">
        ${facts.join(sep)}
      </p>`;
}

/** Petit texte d'introduction d'une section (champ field de home.json). */
const intro = (key, field) => ({ home }) =>
  `<p data-home="${key}" class="max-w-xs leading-relaxed text-muted lg:pb-3">${escape(home[field])}</p>`;

/** Morceaux de l'accueil, par nom (commentaire <!-- home:nom --> d'index.html, attribut data-home). */
export const HOME_PARTS = {
  'nav-status': renderNavStatus,
  status: renderStatus,
  quote: renderQuote,
  lead: renderLead,
  tagline: renderTagline,
  facts: renderFacts,
  'featured-intro': intro('featured-intro', 'featuredIntro'),
  'projects-intro': intro('projects-intro', 'projectsIntro'),
};
