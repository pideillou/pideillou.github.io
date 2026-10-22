// Socle commun à toutes les pages (accueil, fiches projet, page 404) :
// jetons, collection, thème, son, curseur dino (rugissement, extinction), barre d'XP et fiches lues.
import skillsData from '../data/skills.json';
import StorageService from './services/StorageService.js';
import CollectionModel from './models/CollectionModel.js';
import TokenModel from './models/TokenModel.js';
import ThemeModel from './models/ThemeModel.js';
import SoundModel from './models/SoundModel.js';
import EasterEggModel from './models/EasterEggModel.js';
import ThemeView from './views/ThemeView.js';
import SoundView from './views/SoundView.js';
import CursorView from './views/CursorView.js';
import ExtinctionView from './views/ExtinctionView.js';
import KeyboardView from './views/KeyboardView.js';
import XpModel from './models/XpModel.js';
import LevelModel from './models/LevelModel.js';
import XpBarView from './views/XpBarView.js';
import ThemeController from './controllers/ThemeController.js';
import CursorController from './controllers/CursorController.js';
import XpController from './controllers/XpController.js';

/**
 * @param {{ reducedMotion: boolean, onSecret?: (id: string) => void, levels?: string[],
 *   level?: { slug: string, next: { slug: string, title: string } } | null }} options
 *   onSecret : prévenu la première fois qu'un secret est trouvé sur la page (l'accueil l'annonce dans le terminal).
 *   levels : identifiants de toutes les fiches projet. level : la fiche affichée (absente hors des fiches).
 */
export function setupSite({ reducedMotion, onSecret = () => {}, levels: levelSlugs = [], level = null }) {
  const skillNames = skillsData.skills.map((skill) => skill.name);
  const collection = new CollectionModel(skillNames, new StorageService('portfolio:collection'));
  const tokens = new TokenModel(new StorageService('portfolio:tokens'));

  // Thèmes : les thèmes secrets se débloquent par un jackpot ou le code Konami.
  const UNLOCKS = {
    jackpot: () => collection.state.jackpot,
    konami: () => tokens.hasClaimed('secret:konami'),
  };
  const theme = new ThemeModel(new StorageService('portfolio:theme'), (condition) => UNLOCKS[condition]?.() ?? false);
  const themeView = new ThemeView();
  new ThemeController(theme, themeView);

  // Son : le jingle du jackpot est coupé par défaut, « son off » coupe aussi le dino.
  const sound = new SoundModel(new StorageService('portfolio:sound'));
  const soundView = new SoundView();

  // Taper « dino » change le curseur ; dix rugissements font tomber la météorite.
  const dino = new EasterEggModel('dino');
  dino.addEventListener('change', ({ detail }) => {
    if (detail.active) tokens.earn('dino');
  });
  new CursorController(dino, new CursorView(), {
    sound,
    soundView,
    extinction: new ExtinctionView({ reducedMotion }),
    onExtinction: () => {
      if (tokens.hasClaimed('secret:extinction')) return;
      tokens.earn('secret:extinction');
      onSecret('extinction');
    },
  });
  new KeyboardView().bindKeys((key) => dino.type(key));

  // Barre d'XP de lecture : la première page lue jusqu'au bout rapporte un jeton.
  // Sur une fiche projet, la fiche compte comme un niveau fini ; les finir toutes rapporte un jeton de plus.
  const levels = new LevelModel(new StorageService('portfolio:levels'), levelSlugs);
  new XpController(new XpModel(), new XpBarView({ reducedMotion }), {
    onComplete: () => {
      let gained = tokens.hasClaimed('xp') ? 0 : 1;
      tokens.earn('xp');
      if (!level) return { gained, level: null };

      const isNew = levels.finish(level.slug);
      const { count, total, complete } = levels.state;
      const cleared = complete && !tokens.hasClaimed('levels');
      if (cleared) {
        tokens.earn('levels');
        gained += 1;
      }
      // Le projet suivant n'est proposé que s'il reste à lire.
      const next = levels.isDone(level.next.slug) ? null : level.next.title;
      return { gained, level: { isNew, count, total, cleared, next } };
    },
  });

  return { skillNames, collection, tokens, theme, themeView, sound, soundView, dino, levels };
}
