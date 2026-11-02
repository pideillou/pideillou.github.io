// Aperçu du back-office (/admin/) : une page ouverte avec « ?apercu » affiche le contenu
// en cours de modification au lieu du contenu publié. Chargé seulement dans ce cas
// (import dynamique dans src/main.js et src/project.js), il n'alourdit pas le site.
import projects from '../data/projects.json';
import profile from '../data/profile.json';
import education from '../data/education.json';
import skills from '../data/skills.json';
import contact from '../data/contact.json';
import seo from '../data/seo.json';
import credits from '../data/credits.json';
import changelog from '../data/changelog.json';
import rewards from '../data/rewards.json';
import PreviewService from './services/PreviewService.js';
import StorageService from './services/StorageService.js';
import PreviewView from './views/PreviewView.js';
import PreviewController from './controllers/PreviewController.js';

/**
 * Applique le contenu du back-office. À attendre avant de démarrer le reste du site.
 * @param {'home' | 'project'} page
 */
export function startPreview(page) {
  // Adresse : /?apercu=<section>&canal=<id> pour l'accueil, /projets/<slug>/?apercu&canal=<id> pour une fiche.
  const params = new URLSearchParams(location.search);
  return new PreviewController(
    new PreviewService(params.get('canal') ?? ''),
    new PreviewView(new StorageService('portfolio:apercu-scroll', { session: true })),
    {
      data: { projects, profile, education, skills, contact, seo, credits, changelog, rewards },
      page,
      slug: location.pathname.match(/\/projets\/([a-z0-9-]+)/)?.[1],
      section: params.get('apercu'),
      base: import.meta.env.BASE_URL,
    },
  ).start();
}
