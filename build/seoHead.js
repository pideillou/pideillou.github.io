// Référencement de l'accueil : titre, description, adresse canonique, aperçu de partage
// (Open Graph) et fiche de présentation pour Google (JSON-LD Person et WebSite),
// fabriqués à la place du commentaire <!-- seo:head --> d'index.html (voir build/htmlSection.js).
// Textes à modifier : src/data/seo.json. Nom, formation, ville, école : src/data/profile.json.
// Profils publics (GitHub, LinkedIn…) : « links » de src/data/contact.json.
import htmlSection, { escape } from './htmlSection.js';

const FILES = { contact: 'src/data/contact.json', profile: 'src/data/profile.json', seo: 'src/data/seo.json' };
const SITE = 'https://pideillou.github.io/';

// L'image de partage (dans public/) doit faire 1200 × 630 : le format attendu par LinkedIn, Discord, WhatsApp…
const IMAGE = { width: 1200, height: 630 };

function render({ contact, profile, seo }) {
  const [city] = profile.city.split(',');
  const person = {
    '@type': 'Person',
    '@id': `${SITE}#person`,
    name: profile.name,
    url: SITE,
    description: `Étudiant en ${profile.school}`,
    address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'FR' },
    affiliation: { '@type': 'CollegeOrUniversity', name: profile.institution },
    // Google relie ces profils au site : c'est bien la même personne.
    sameAs: contact.links.map(({ url }) => url),
  };
  const website = { '@type': 'WebSite', '@id': `${SITE}#website`, name: `Portfolio de ${profile.name}`, url: SITE, inLanguage: 'fr', author: { '@id': person['@id'] } };
  const data = { '@context': 'https://schema.org', '@graph': [person, website] };

  return `<title>${escape(seo.title)}</title>
  <meta name="description" content="${escape(seo.description)}">
  <link rel="canonical" href="${SITE}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${escape(seo.title)}">
  <meta property="og:description" content="${escape(seo.description)}">
  <meta property="og:url" content="${SITE}">
  <meta property="og:image" content="${SITE}${escape(seo.image)}">
  <meta property="og:image:width" content="${IMAGE.width}">
  <meta property="og:image:height" content="${IMAGE.height}">
  <meta property="og:image:alt" content="${escape(seo.imageAlt)}">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">${
    // Preuve que le site appartient à Paul, demandée par Google Search Console.
    seo.googleVerification ? `\n  <meta name="google-site-verification" content="${escape(seo.googleVerification)}">` : ''
  }
  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/** Plugin Vite de l'en-tête SEO de l'accueil. */
export default function seoHead() {
  return htmlSection({ name: 'portfolio-seo-head', placeholder: '<!-- seo:head -->', files: FILES, render });
}
