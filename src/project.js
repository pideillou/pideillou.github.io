// Point d'entrée des fiches projet (pages fabriquées par build/projectPages.js).
// Le contenu est déjà dans le HTML : le JS ajoute le thème, le dino, le sommaire actif
// et la transition d'arrivée (le visuel du projet qui se range à sa place).
import { setupSite } from './js/site.js';
import NavModel from './js/models/NavModel.js';
import StorageService from './js/services/StorageService.js';
import TocView from './js/views/TocView.js';
import PageTransitionView from './js/views/PageTransitionView.js';
import TocController from './js/controllers/TocController.js';
import PageTransitionController from './js/controllers/PageTransitionController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chaque fiche est un niveau : la liste des fiches et le projet suivant sont écrits dans le HTML au build.
const article = document.querySelector('[data-level]');
setupSite({
  reducedMotion,
  levels: article?.dataset.levels.split(' ') ?? [],
  level: article && {
    slug: article.dataset.level,
    next: { slug: article.dataset.nextLevel, title: article.dataset.nextTitle },
  },
});

const toc = document.querySelector('[data-toc]');
if (toc) new TocController(new NavModel(), new TocView(toc));

const transitions = new PageTransitionController(
  new PageTransitionView({ reducedMotion }),
  new StorageService('portfolio:transition', { session: true }),
);
transitions.enter({
  hero: document.querySelector('[data-hero]'),
  parts: [...document.querySelectorAll('[data-enter]')],
});

// Pas de machine à sous ici : on retire tout de suite le cache posé par le CSS.
document.documentElement.dataset.ready = '';
