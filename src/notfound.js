// Point d'entrée de la page 404 « Game over ».
import { setupSite } from './js/site.js';
import { nextSecretHint } from './js/models/commands.js';
import GameOverView from './js/views/GameOverView.js';
import GameOverController from './js/controllers/GameOverController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Aperçu du back-office : la fiche d'un projet pas encore publié n'existe pas sur le site.
// Elle est fabriquée dans le navigateur à la place du « Game over » (src/project.js, src/js/preview.js).
const previewProject = new URLSearchParams(location.search).has('apercu') && location.pathname.startsWith(`${import.meta.env.BASE_URL}projets/`);

if (previewProject) {
  import('./project.js');
} else {
  const { tokens } = setupSite({ reducedMotion });
  // Tomber sur la page 404 rapporte un jeton, une fois : un petit lot de consolation.
  tokens.earn('game-over');

  const root = document.querySelector('[data-game-over]');
  if (root) {
    const hint = nextSecretHint(tokens, !window.matchMedia('(pointer: fine)').matches);
    new GameOverController(new GameOverView(root, { reducedMotion }), {
      home: import.meta.env.BASE_URL,
      hint: hint ? `Indice pour un secret : ${hint}` : 'Tous les secrets sont trouvés. Respect.',
    });
  }

  document.documentElement.dataset.ready = '';
}
