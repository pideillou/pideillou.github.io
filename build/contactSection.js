// Plugins Vite de la section « Contact » et du pied de page de l'accueil
// (HTML : src/js/render/contactSection.js).
import htmlSection from './htmlSection.js';
import { renderContact, renderFooter } from '../src/js/render/contactSection.js';

const FILES = { contact: 'src/data/contact.json', profile: 'src/data/profile.json' };

/** Plugin Vite de la section « Contact ». */
export default function contactSection() {
  return htmlSection({ name: 'portfolio-contact-section', placeholder: '<!-- contact:section -->', files: FILES, render: renderContact });
}

/** Plugin Vite du pied de page de l'accueil. */
export function siteFooter() {
  return htmlSection({ name: 'portfolio-site-footer', placeholder: '<!-- site:footer -->', files: FILES, render: renderFooter });
}
