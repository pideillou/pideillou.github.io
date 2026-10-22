import { SECRETS, foundSecrets, secretFoundLines } from '../models/commands.js';
import { JACKPOT_BONUS } from '../models/TokenModel.js';

// Fréquence de mise à jour du résumé de l'en-tête (recharge des jetons) (ms).
const TICK = 1000;
// Le secret de l'oiseau de nuit se trouve entre minuit et cette heure.
const NIGHT_END = 5;

// Message affiché pour chaque bonus de découverte (les secrets ont leur propre message).
const EARN_MESSAGES = {
  lamp: 'lampe allumée',
  dino: 'dino trouvé',
  profil: 'section Profil visitée',
  projets: 'section Projets visitée',
  contact: 'section Contact visitée',
  'score:100': '100 points au jeu du dino',
  'snake:10': '10 points au snake',
  credits: 'générique regardé jusqu’au bout',
  corner: 'le logo a touché un coin pile',
  xp: 'page lue jusqu’au bout',
  'game-over': 'page 404 trouvée',
};

/**
 * Relie le terminal à sa vue et aux événements du site :
 * tirages de la machine à sous, récompenses, jetons gagnés, code Konami, visite nocturne.
 */
export default class TerminalController {
  #count = 0;

  /**
   * @param {import('../models/TerminalModel.js').default} terminal
   * @param {import('../views/TerminalView.js').default} view
   * @param {{ slotMachine: import('../models/SlotMachineModel.js').default,
   *   collection: import('../models/CollectionModel.js').default,
   *   tokens: import('../models/TokenModel.js').default,
   *   theme: import('../models/ThemeModel.js').default,
   *   konami: import('../models/EasterEggModel.js').default,
   *   rewards: Record<'collection' | 'jackpot' | 'secrets', { title: string, text: string }>,
   *   drawEnabled: boolean }} site
   */
  constructor(terminal, view, { slotMachine, collection, tokens, theme, konami, rewards, drawEnabled }) {

    terminal.addEventListener('output', ({ detail }) => view.print(detail.lines));
    terminal.addEventListener('clear', () => view.clear());
    view.bindRun((input) => terminal.run(input));
    view.bindKeys({ complete: (input) => terminal.complete(input), browse: (step) => terminal.browse(step) });
    view.bindShortcut(() => view.setOpen(!view.isOpen));

    terminal.print([
      { text: 'Bienvenue dans le terminal du portfolio.', tone: 'accent' },
      { text: 'Tape help pour voir les commandes, ou clique sur un raccourci.', tone: 'muted' },
    ]);

    // Secret de l'oiseau de nuit : passer entre minuit et 5 h.
    if (new Date().getHours() < NIGHT_END) {
      const isNew = !tokens.hasClaimed('secret:nuit');
      tokens.earn('secret:nuit');
      terminal.print([{ text: 'Toi aussi tu codes tard ? L’atelier est ouvert.', tone: 'accent' }, ...(isNew ? secretFoundLines(tokens) : [])]);
    }

    // Code Konami tapé sur la page : thème « origine » (la palette d'origine du site). Le retaper ramène le thème d'avant.
    let themeBeforeKonami = 'defaut';
    konami.addEventListener('change', () => {
      view.setOpen(true);
      if (theme.current === 'origine') {
        theme.set(themeBeforeKonami);
        terminal.print([{ text: `Code Konami : retour au thème « ${themeBeforeKonami} ».`, tone: 'muted' }]);
        return;
      }
      const isNew = !tokens.hasClaimed('secret:konami');
      tokens.earn('secret:konami');
      themeBeforeKonami = theme.current;
      theme.set('origine');
      terminal.print([
        { text: '↑ ↑ ↓ ↓ ← → ← → B A', tone: 'muted' },
        { text: 'Code Konami ! Thème « origine » activé : la palette des débuts du site.', tone: 'accent' },
        { text: 'Pour revenir : retape le code, ou tape theme defaut.', tone: 'muted' },
        ...(isNew ? secretFoundLines(tokens) : []),
      ]);
    });

    // Résumé de l'en-tête : collection et jetons.
    const summary = () => view.renderSummary({ ...collection.state, tokens: tokens.state.tokens });
    summary();
    setInterval(summary, TICK);
    tokens.addEventListener('change', summary);

    tokens.addEventListener('earn', ({ detail }) => {
      const message = EARN_MESSAGES[detail.reason];
      if (message) terminal.print([{ text: `+1 jeton : ${message}`, tone: 'success' }]);
      // Dernier secret trouvé : annoncé après la réponse de la commande en cours.
      if (detail.reason.startsWith('secret:') && foundSecrets(tokens).length === SECRETS.length) {
        queueMicrotask(() => terminal.print([{ text: `★ ${rewards.secrets.title} : ${rewards.secrets.text}`, tone: 'accent' }]));
      }
    });

    if (!drawEnabled) {
      view.hideDraw();
      return;
    }

    slotMachine.addEventListener('spin', ({ detail }) => {
      this.#count += 1;
      terminal.print([{ text: `tirage #${this.#count} → ${detail.result.join(' · ')}`, tone: detail.jackpot ? 'accent' : 'default' }]);
      if (detail.jackpot) {
        terminal.print([{ text: `★ JACKPOT ! +${JACKPOT_BONUS} jetons, et le thème « or » est débloqué (theme or).`, tone: 'accent' }]);
      }
      collection.add(detail.result, detail.jackpot);
    });

    // Annonce les récompenses au moment où elles se débloquent.
    let unlocked = { jackpot: collection.state.jackpot, complete: collection.state.complete };
    collection.addEventListener('change', ({ detail }) => {
      if (detail.jackpot && !unlocked.jackpot) {
        terminal.print([{ text: `★ ${rewards.jackpot.title} : ${rewards.jackpot.text}`, tone: 'accent' }]);
      }
      if (detail.complete && !unlocked.complete) {
        terminal.print([{ text: `★ ${rewards.collection.title} : ${rewards.collection.text}`, tone: 'accent' }]);
      }
      unlocked = { jackpot: detail.jackpot, complete: detail.complete };
      summary();
    });
  }
}
