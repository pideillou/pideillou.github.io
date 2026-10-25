// Point d'entrée de la page 404 « Game over ».
import { setupSite } from './js/site.js';
import { nextSecretHint } from './js/models/commands.js';
import GameOverView from './js/views/GameOverView.js';
import GameOverController from './js/controllers/GameOverController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
