// Plugin Vite de l'en-tête SEO de l'accueil (HTML : src/js/render/seoHead.js).
import htmlSection from './htmlSection.js';
import { renderSeoHead } from '../src/js/render/seoHead.js';

const FILES = { contact: 'src/data/contact.json', profile: 'src/data/profile.json', seo: 'src/data/seo.json' };

export default function seoHead() {
  return htmlSection({ name: 'portfolio-seo-head', placeholder: '<!-- seo:head -->', files: FILES, render: renderSeoHead });
}
