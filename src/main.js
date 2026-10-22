// Point d'entrée JavaScript : relie modèles, vues et contrôleurs.
// Le CSS est chargé par un <link> dans index.html, pour être appliqué avant le premier affichage.
import skillsData from './data/skills.json';
import rewardsData from './data/rewards.json';
import profileData from './data/profile.json';
import changelogData from './data/changelog.json';
import creditsData from './data/credits.json';
import projectsData from './data/projects.json';
import contactData from './data/contact.json';
import ContactModel from './js/models/ContactModel.js';
import ContactView from './js/views/ContactView.js';
import ContactController from './js/controllers/ContactController.js';
import ContactService from './js/services/ContactService.js';
import FooterView from './js/views/FooterView.js';
import AvatarView from './js/views/AvatarView.js';
import FooterController from './js/controllers/FooterController.js';
import ProjectModel from './js/models/ProjectModel.js';
import FeaturedProjectsView from './js/views/FeaturedProjectsView.js';
import ProjectListView from './js/views/ProjectListView.js';
import SkillMarqueeView from './js/views/SkillMarqueeView.js';
import ProjectController from './js/controllers/ProjectController.js';
import SkillMarqueeController from './js/controllers/SkillMarqueeController.js';
import { setupSite } from './js/site.js';
import PageTransitionView from './js/views/PageTransitionView.js';
import PageTransitionController from './js/controllers/PageTransitionController.js';
import CreditsView from './js/views/CreditsView.js';
import SnakeGameView from './js/views/SnakeGameView.js';
import ScreensaverView from './js/views/ScreensaverView.js';
import ScreensaverController from './js/controllers/ScreensaverController.js';
import StorageService from './js/services/StorageService.js';
import { contrastRatio } from './js/utils/contrast.js';
import SlotMachineModel from './js/models/SlotMachineModel.js';
import LampModel from './js/models/LampModel.js';
import EasterEggModel from './js/models/EasterEggModel.js';
import GameScoreModel from './js/models/GameScoreModel.js';
import TerminalModel from './js/models/TerminalModel.js';
import { createCommands, secretFoundLines, playerStats, foundSecrets, SECRETS } from './js/models/commands.js';
import NavModel from './js/models/NavModel.js';
import SlotLoaderView from './js/views/SlotLoaderView.js';
import NavView from './js/views/NavView.js';
import MiniMapView from './js/views/MiniMapView.js';
import MiniMapController from './js/controllers/MiniMapController.js';
import TabsModel from './js/models/TabsModel.js';
import TabsView from './js/views/TabsView.js';
import TabsController from './js/controllers/TabsController.js';
import ClockView from './js/views/ClockView.js';
import ScrambleView from './js/views/ScrambleView.js';
import SpotlightView from './js/views/SpotlightView.js';
import KeyboardView from './js/views/KeyboardView.js';
import TerminalView from './js/views/TerminalView.js';
import EffectsView from './js/views/EffectsView.js';
import InspectView from './js/views/InspectView.js';
import RecView from './js/views/RecView.js';
import DinoGameView from './js/views/DinoGameView.js';
import TapView from './js/views/TapView.js';
import JackpotView from './js/views/JackpotView.js';
import SlotLoaderController from './js/controllers/SlotLoaderController.js';
import NavController from './js/controllers/NavController.js';
import ClockController from './js/controllers/ClockController.js';
import ScrambleController from './js/controllers/ScrambleController.js';
import SpotlightController from './js/controllers/SpotlightController.js';
import TerminalController from './js/controllers/TerminalController.js';
import JackpotController from './js/controllers/JackpotController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Indice discret pour les curieux qui ouvrent la console du navigateur.
console.info(
  '%cPp%c  Tu fouilles la console ? Bon réflexe.\nOuvre le terminal (Ctrl + K) et tape : cat secrets.txt',
  'background:#ffcc00;color:#0b0b1a;font:bold 16px monospace;padding:4px 8px',
  'font:12px monospace',
);
const hasMouse = window.matchMedia('(pointer: fine)').matches;
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

// Transitions entre l'accueil et les fiches projet (src/js/views/PageTransitionView.js).
const transitions = new PageTransitionController(
  new PageTransitionView({ reducedMotion }),
  new StorageService('portfolio:transition', { session: true }),
);
// Retour depuis une fiche (lien ou bouton Précédent du navigateur) : pas de machine à sous.
const [navigation] = performance.getEntriesByType('navigation');
const backFromProject = transitions.arrival !== null || navigation?.type === 'back_forward';

// Au rechargement, on repart du haut de la page : sinon le navigateur restaure
// l'ancienne position de défilement, ou l'ancre (#projets…) laissée par la nav.
// Au retour arrière, le navigateur garde la main pour retrouver l'endroit quitté.
if (navigation?.type !== 'back_forward') {
  history.scrollRestoration = 'manual';
  if (navigation?.type === 'reload' && location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
}

// Socle commun à toutes les pages : jetons, collection, thème, son, curseur dino (src/js/site.js).
// Un secret trouvé hors du terminal y est annoncé, une fois le terminal créé (plus bas).
let announceSecret = () => {};
const { skillNames, collection, tokens, theme, themeView, sound, soundView, dino, levels } = setupSite({
  reducedMotion,
  levels: projectsData.projects.map(({ slug }) => slug),
  onSecret: (id) => announceSecret(id),
});
const slotMachine = new SlotMachineModel(skillNames);
// Dernier tirage, pour retrouver les mêmes projets en revenant d'une fiche.
const lastDraw = new StorageService('portfolio:last-draw');
slotMachine.addEventListener('spin', ({ detail }) => lastDraw.save(detail.result));

// L'écran de chargement : la page n'est visible qu'une fois qu'il est fermé.
const loader = document.querySelector('[data-slot-loader]');
const waitForPage = () =>
  loader?.open ? new Promise((resolve) => loader.addEventListener('close', () => resolve(), { once: true })) : Promise.resolve();

// Projets : chaque tirage choisit les trois projets mis en avant, distribués comme des cartes.
const featuredSection = document.getElementById('projets');
const listSection = document.getElementById('tous-les-projets');
let projects = null;
if (featuredSection && listSection) {
  projects = new ProjectController(
    new ProjectModel(projectsData),
    {
      featured: new FeaturedProjectsView(featuredSection, { reducedMotion, waitForPage }),
      list: new ProjectListView(listSection),
    },
    slotMachine,
  );
}
const marquee = document.querySelector('[data-marquee]');
if (marquee) new SkillMarqueeController(skillsData.skills, new SkillMarqueeView(marquee));

// Lien partagé avec un thème (?theme=crt) : appliqué s'il existe et s'il est débloqué.
const sharedTheme = new URLSearchParams(location.search).get('theme');
if (sharedTheme) theme.set(sharedTheme);

// Navigation : visiter une section rapporte un jeton (une fois).
const BONUS_SECTIONS = ['profil', 'projets', 'contact'];
const navModel = new NavModel();
navModel.addEventListener('change', ({ detail }) => {
  if (BONUS_SECTIONS.includes(detail.activeId)) tokens.earn(detail.activeId);
});
const nav = document.querySelector('[data-nav]');
if (nav) new NavController(navModel, new NavView(nav));
const minimap = document.querySelector('[data-minimap]');
if (minimap) new MiniMapController(navModel, new MiniMapView(minimap));

// Profil : le menu pause et ses onglets (loisirs, en ce moment…).
const pause = document.querySelector('[data-pause]');
if (pause) {
  const tabs = new TabsView(pause);
  new TabsController(new TabsModel(tabs.ids), tabs);
}

// Contact : formulaire « mode coop ». Les codes de récompense glissés dans le message
// sont vérifiés (le visiteur les a-t-il vraiment débloqués ?) ; envoyer un message rapporte un jeton.
const contactSection = document.getElementById('contact');
if (contactSection?.querySelector('[data-contact-form]')) {
  const UNLOCKED = {
    collection: () => collection.state.complete,
    jackpot: () => collection.state.jackpot,
    secrets: () => foundSecrets(tokens).length === SECRETS.length,
  };
  const codes = Object.entries(rewardsData).map(([id, { code, title }]) => ({ code, title, unlocked: UNLOCKED[id] ?? (() => false) }));
  new ContactController(
    new ContactModel({ quests: contactData.quests, codes, maxLength: contactData.maxLength }, new StorageService('portfolio:contact-draft', { session: true })),
    new ContactView(contactSection, { reducedMotion }),
    new ContactService(contactData),
    {
      onSent: () => {
        const rewarded = !tokens.hasClaimed('message');
        tokens.earn('message');
        return rewarded;
      },
    },
  );
}

const clock = document.querySelector('[data-clock]');
if (clock) new ClockController(new ClockView(clock));

// Lampe : allumer la lampe rapporte un jeton (une fois).
let lamp = null;
const spotlight = document.querySelector('[data-spotlight]');
// Coulisses : un calque sur l'accueil, puis un par section.
const reveals = [...document.querySelectorAll('[data-reveal]')];
const lampToggle = document.querySelector('[data-lamp-toggle]');
if (spotlight && reveals.length && lampToggle) {
  lamp = new LampModel(new StorageService('portfolio:lamp'));
  lamp.addEventListener('change', ({ detail }) => {
    if (detail.on) tokens.earn('lamp');
  });
  new SpotlightController(lamp, new SpotlightView(spotlight, reveals, lampToggle));
}

const scramble = new ScrambleController(new ScrambleView(document), { reducedMotion });

// Code Konami au clavier (thème secret « origine »). Le code « dino » est géré par src/js/site.js.
const konami = new EasterEggModel(KONAMI);
new KeyboardView().bindKeys((key) => konami.type(key));

// Terminal : la machine à sous n'y est pas proposée si les animations sont réduites.
const terminalRoot = document.querySelector('[data-terminal]');
if (terminalRoot) {
  const view = new TerminalView(terminalRoot, { reducedMotion });
  const effects = new EffectsView({ reducedMotion });
  const inspect = new InspectView();
  const rec = new RecView();
  const credits = new CreditsView();

  // Jeux du terminal : record de chaque jeu, et bonus unique à partir d'un certain score.
  const GAMES = {
    dino: { View: DinoGameView, scores: new GameScoreModel(new StorageService('portfolio:dino')), bonus: ['score:100', 100] },
    snake: { View: SnakeGameView, scores: new GameScoreModel(new StorageService('portfolio:snake')), bonus: ['snake:10', 10] },
  };
  const play = (name) => {
    const { View, scores, bonus } = GAMES[name];
    // cause : ce qui a battu le joueur (dino seulement), lu aussi par les lecteurs d'écran.
    const game = new View((score, cause) => {
      const { best, isRecord } = scores.record(score);
      if (score >= bonus[1]) tokens.earn(bonus[0]);
      terminal.print([
        {
          text: `Partie terminée : ${score} point${score > 1 ? 's' : ''}${cause ? `, battu par ${cause}` : ''}${isRecord ? ' · nouveau record !' : ` · record : ${best}`}`,
          tone: isRecord ? 'accent' : 'muted',
        },
      ]);
    });
    view.setOpen(true);
    view.mount(game.element).then(() => game.start());
  };

  const terminal = new TerminalModel(
    createCommands({
      profile: profileData,
      changelog: changelogData.entries,
      sections: ['accueil', 'projets', 'profil', 'parcours', 'contact'],
      getHistory: () => terminal.history,
      clear: () => terminal.clear(),
      theme,
      lamp,
      dino,
      tokens,
      collection,
      levels,
      slotMachine,
      drawEnabled: !reducedMotion,
      rewards: rewardsData,
      credits: creditsData,
      sound,
      print: (lines) => terminal.print(lines),
      getBestScores: () => ({ dino: GAMES.dino.scores.best, snake: GAMES.snake.scores.best }),
      actions: {
        scrollTo: (id) => view.scrollToSection(id),
        close: () => view.setOpen(false),
        glitch: () => effects.glitch(),
        matrix: () => effects.matrix(),
        palette: () => themeView.palette,
        contrast: contrastRatio,
        inspect: () => {
          inspect.toggle();
          return inspect.isActive;
        },
        rec: () => {
          rec.toggle();
          return rec.isRecording;
        },
        play,
        // Générique : animé seulement si les animations sont permises (sinon, version texte).
        credits: () => {
          if (reducedMotion) return false;
          const stats = playerStats(tokens, { dino: GAMES.dino.scores.best, snake: GAMES.snake.scores.best });
          credits.play({ ...creditsData, stats }).then((complete) => {
            if (complete) tokens.earn('credits');
          });
          return true;
        },
        copy: (text) => navigator.clipboard.writeText(text),
        shareUrl: (id) => `${location.origin}${location.pathname}?theme=${encodeURIComponent(id)}`,
        blip: () => soundView.blip(),
        effectsEnabled: effects.enabled,
        hasMouse,
      },
    }),
  );
  new TerminalController(terminal, view, {
    slotMachine,
    collection,
    tokens,
    theme,
    konami,
    rewards: rewardsData,
    drawEnabled: !reducedMotion,
  });

  // Pied de page : score de la partie du visiteur, et raccourcis vers le terminal et le générique.
  const footer = document.querySelector('[data-footer]');
  const footerAvatar = footer?.querySelector('[data-avatar="footer"]');
  if (footerAvatar) new AvatarView(footerAvatar).playWhenVisible();
  if (footer) {
    new FooterController(new FooterView(footer), {
      sources: [tokens, collection],
      getStats: () => ({
        tokens: tokens.state.tokens,
        skills: { found: collection.state.found, total: collection.state.total },
        secrets: { found: foundSecrets(tokens).length, total: SECRETS.length },
        levels: { found: levels.state.count, total: levels.state.total },
      }),
      onAction: (action) => {
        view.setOpen(true);
        if (action === 'credits') terminal.run('credits');
      },
    });
  }

  // Secrets trouvés sur la page (hors terminal) : annoncés ici avec le compteur et l'indice suivant.
  const SECRET_MESSAGES = { extinction: '☄ Extinction. Les dinosaures ont disparu.' };
  announceSecret = (id) => terminal.print([{ text: SECRET_MESSAGES[id], tone: 'accent' }, ...secretFoundLines(tokens)]);

  // Sans clavier (mobile) : 5 tapotements sur le nom lancent le jeu du dino.
  const title = document.getElementById('accueil-title');
  if (title) {
    new TapView(title).bindTaps(5, () => {
      tokens.earn('dino');
      play('dino');
    });
  }

  // Économiseur d'écran après trois minutes sans activité : un secret, et un bonus si le logo touche un coin.
  new ScreensaverController(new ScreensaverView(), {
    reducedMotion,
    onStart: () => {
      if (tokens.hasClaimed('secret:veille')) return;
      tokens.earn('secret:veille');
      terminal.print([{ text: 'Tu t’es endormi ? L’économiseur d’écran veillait.', tone: 'accent' }, ...secretFoundLines(tokens)]);
    },
    onCorner: () => tokens.earn('corner'),
  });
}

// Jackpot : jetons offerts et grande célébration, une fois la page visible.
new JackpotController(slotMachine, new JackpotView({ reducedMotion }), {
  tokens,
  theme,
  themeView,
  sound,
  soundView,
  target: terminalRoot,
  waitForPage,
});

// La machine à sous accueille le visiteur qui arrive sur le site. En revenant d'une fiche,
// on retrouve directement les projets du dernier tirage.
if (loader && !backFromProject) {
  new SlotLoaderController(slotMachine, new SlotLoaderView(loader), { reducedMotion }).start();
} else {
  const saved = lastDraw.load(null);
  if (Array.isArray(saved)) projects?.restore(saved);
  transitions.enter();
}

// Les textes se décodent et l'avatar salue quand la page devient visible : à la fermeture de la machine à sous.
const heroAvatar = document.querySelector('[data-avatar="hero"]');
waitForPage().then(() => {
  scramble.start();
  if (heroAvatar) new AvatarView(heroAvatar).play();
});

// Retire le cache posé par le CSS : la machine à sous est ouverte (ou ne s'ouvrira pas).
document.documentElement.dataset.ready = '';
