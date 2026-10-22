// Point d'entrée de la page des mentions légales.
// Le texte est déjà dans le HTML : le JS ajoute le thème, le dino et le bouton d'effacement des données.
// Pas de barre de lecture ni de jeton ici : ce n'est pas un niveau du jeu.
import { setupSite } from './js/site.js';
import StorageService from './js/services/StorageService.js';
import DataResetView from './js/views/DataResetView.js';
import DataResetController from './js/controllers/DataResetController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

setupSite({ reducedMotion, xp: false });

const reset = document.querySelector('[data-reset]');
if (reset) new DataResetController(new DataResetView(reset), { clear: () => StorageService.clearAll('portfolio:') });

document.documentElement.dataset.ready = '';
