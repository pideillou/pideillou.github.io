// Plugins Vite des textes de l'accueil (HTML : src/js/render/homeSection.js) :
// un plugin par commentaire <!-- home:nom --> d'index.html.
import htmlSection from './htmlSection.js';
import { HOME_PARTS } from '../src/js/render/homeSection.js';

const FILES = { home: 'src/data/home.json', profile: 'src/data/profile.json' };

export default function homeSection() {
  return Object.entries(HOME_PARTS).map(([name, render]) =>
    htmlSection({ name: `portfolio-home-${name}`, placeholder: `<!-- home:${name} -->`, files: FILES, render }),
  );
}
