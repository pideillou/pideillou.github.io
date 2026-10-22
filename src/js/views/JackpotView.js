import { pickRandom } from '../utils/random.js';
import { scrambleText } from '../utils/scramble.js';

// Déroulé de la célébration (ms depuis le début).
const FOUNTAIN_END = 1600;
const RAIN_START = 1800;
const RAIN_END = 3600;
const BURSTS = [450, 900, 1350, 1850, 2400, 2900, 3400];
const WORD_START = 150;
const LETTER_GAP = 70;
const LETTER_DECODE = 450;
const SUBTITLE_START = 900;
const SUBTITLE_DECODE = 600;
const TICKET_START = 1300;
const SHIMMER_START = 1600;
const FLIGHT_START = 3900;
const FLIGHT_DURATION = 750;
const END = 4800;

// Physique des particules, réglée pour 60 images par seconde.
const FRAME = 1000 / 60;
const MAX_STEP = 3;

const WORD = 'JACKPOT';
const DECODE_GLYPHS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>'];
const CODE_GLYPHS = [...'01<>/{};★'];
const GRAVITY = 0.32;
const SPARKS_PER_BURST = 70;

// Éléments de la page soufflés par l'explosion, puis remis en place.
const BLOWN = '[data-nav], #accueil h1, #accueil figure, #accueil p, #accueil a[href^="#"], main h2';

// Classes complètes (jamais construites dynamiquement).
const ROOT_CLASSES = 'fixed inset-0 z-50 cursor-pointer overflow-hidden';
// Voile sombre au centre pour que « JACKPOT » reste lisible ; les bords laissent voir la page dorée.
const VEIL_CLASSES = 'absolute inset-0 bg-radial from-surface/90 via-surface/70 to-transparent';
const FLASH_CLASSES = 'absolute inset-0 bg-radial from-gold-light/70 via-gold/25 to-transparent opacity-0';
const CANVAS_CLASSES = 'absolute inset-0 size-full';
const SHIMMER_CLASSES = 'absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-gold-light/40 to-transparent';
const STAGE_CLASSES = 'absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center perspective-distant';
const WORD_CLASSES = 'flex font-display text-hero font-bold';
const LETTER_CLASSES =
  'inline-block w-[0.8em] bg-linear-to-b from-gold-light via-gold to-gold-dark bg-clip-text text-center text-transparent drop-shadow-[0_0_18px_var(--color-gold)]';
const SUBTITLE_CLASSES = 'min-h-6 font-mono text-sm tracking-widest text-ink uppercase sm:text-base';
const TICKET_CLASSES =
  'flex flex-col gap-1 rounded-xl border-2 border-dashed border-gold bg-surface/90 px-6 py-4 font-mono text-sm text-gold shadow-2xl';
const TICKET_TITLE_CLASSES = 'font-bold tracking-widest';

/**
 * @param {string} tag
 * @param {string} className
 * @returns {HTMLElement}
 */
function create(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

/**
 * Grande célébration du jackpot, par-dessus la page : flash, page soufflée,
 * fontaine de pièces et de symboles de code, feux d'artifice, « JACKPOT » qui se décode,
 * ticket doré qui se retourne puis s'envole vers le terminal.
 * Un clic ou Échap l'écourte. Rien ne se joue si l'utilisateur a demandé moins d'animations.
 */
export default class JackpotView {
  #reducedMotion;
  #playing = false;

  /** @param {{ reducedMotion: boolean }} options */
  constructor({ reducedMotion }) {
    this.#reducedMotion = reducedMotion;
  }

  /** @returns {boolean} Vrai si la célébration peut se jouer. */
  get enabled() {
    return !this.#reducedMotion;
  }

  /**
   * @param {{ skill: string, bonus: number }} jackpot Compétence tirée trois fois, jetons offerts.
   * @param {{ target?: HTMLElement | null }} [options] Élément où le ticket va se ranger (le terminal).
   * @returns {Promise<void>} Résolue à la fin de la célébration.
   */
  play({ skill, bonus }, { target = null } = {}) {
    if (!this.enabled || this.#playing) return Promise.resolve();
    this.#playing = true;

    return new Promise((resolve) => {
      const animations = [];
      const timers = [];
      const run = (element, keyframes, options) => {
        const animation = element.animate(keyframes, options);
        animations.push(animation);
        return animation;
      };
      const at = (delay, callback) => timers.push(setTimeout(callback, delay));

      // Calques de la célébration, décoratifs.
      const root = create('div', ROOT_CLASSES);
      root.setAttribute('aria-hidden', 'true');
      root.dataset.overlay = '';
      const veil = create('div', VEIL_CLASSES);
      const flash = create('div', FLASH_CLASSES);
      const canvas = create('canvas', CANVAS_CLASSES);
      const shimmer = create('div', SHIMMER_CLASSES);
      const stage = create('div', STAGE_CLASSES);
      const word = create('p', WORD_CLASSES);
      const letters = [...WORD].map(() => create('span', LETTER_CLASSES));
      word.append(...letters);
      const subtitle = create('p', SUBTITLE_CLASSES);
      const ticket = create('p', TICKET_CLASSES);
      const ticketTitle = create('span', TICKET_TITLE_CLASSES);
      ticketTitle.textContent = '★ TICKET DORÉ ★';
      const ticketBonus = create('span', '');
      ticketBonus.textContent = `+${bonus} jetons`;
      const ticketTheme = create('span', 'text-ink');
      ticketTheme.textContent = 'thème « or » débloqué';
      ticket.append(ticketTitle, ticketBonus, ticketTheme);
      stage.append(word, subtitle, ticket);
      root.append(veil, flash, canvas, shimmer, stage);
      document.body.append(root);

      const stopParticles = this.#particles(canvas);

      const finish = () => {
        if (!this.#playing) return;
        this.#playing = false;
        timers.forEach(clearTimeout);
        stopParticles();
        animations.forEach((animation) => animation.cancel());
        root.remove();
        document.removeEventListener('keydown', onKey);
        resolve();
      };
      const onKey = (event) => {
        if (event.key === 'Escape') finish();
      };
      root.addEventListener('pointerdown', finish);
      document.addEventListener('keydown', onKey);

      // 1. Flash doré et souffle : les blocs de la page sont projetés puis reviennent.
      run(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 100, fill: 'backwards' });
      run(flash, [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out' });
      document.querySelectorAll(BLOWN).forEach((element) => {
        const dx = (Math.random() - 0.5) * 160;
        const dy = (Math.random() - 0.7) * 120;
        const rotate = (Math.random() - 0.5) * 28;
        run(
          element,
          [
            { transform: 'none' },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, offset: 0.18 },
            { transform: `translate(${-dx * 0.2}px, ${-dy * 0.2}px) rotate(${-rotate * 0.25}deg)`, offset: 0.6 },
            { transform: 'none' },
          ],
          { duration: 1500, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      });

      // 2. « JACKPOT » tombe lettre par lettre, en se décodant façon terminal, puis brille.
      letters.forEach((letter, index) => {
        run(
          letter,
          [
            { transform: 'translateY(-60vh) rotate(-25deg) scale(0.5)', opacity: 0 },
            { transform: 'translateY(0) rotate(4deg) scale(1.2)', opacity: 1, offset: 0.7 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 700, delay: WORD_START + index * LETTER_GAP, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)', fill: 'backwards' },
        );
      });
      run(word, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.6)' }, { filter: 'brightness(1)' }], {
        duration: 900,
        delay: 1100,
        iterations: Infinity,
      });

      const start = performance.now();
      const decode = (now) => {
        if (!this.#playing) return;
        const elapsed = now - start;
        letters.forEach((letter, index) => {
          const locked = elapsed >= WORD_START + index * LETTER_GAP + LETTER_DECODE;
          letter.textContent = locked ? WORD[index] : pickRandom(DECODE_GLYPHS);
        });
        if (elapsed >= SUBTITLE_START) {
          subtitle.textContent = scrambleText(`3 × ${skill}`, Math.min((elapsed - SUBTITLE_START) / SUBTITLE_DECODE, 1));
        }
        if (elapsed < SUBTITLE_START + SUBTITLE_DECODE + 100) requestAnimationFrame(decode);
      };
      requestAnimationFrame(decode);

      // 3. Le ticket doré arrive en se retournant.
      run(
        ticket,
        [
          { transform: 'rotateY(-110deg) scale(0.6)', opacity: 0 },
          { transform: 'rotateY(15deg) scale(1.05)', opacity: 1, offset: 0.7 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 900, delay: TICKET_START, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' },
      );

      // 4. Un reflet doré balaie l'écran, deux fois.
      run(shimmer, [{ transform: 'translateX(-120%) skewX(-12deg)' }, { transform: 'translateX(420%) skewX(-12deg)' }], {
        duration: 1100,
        delay: SHIMMER_START,
        iterations: 2,
        easing: 'ease-in-out',
        fill: 'both',
      });

      // 5. Le ticket s'envole vers le terminal, qui s'illumine en le recevant.
      at(FLIGHT_START, () => {
        run(word, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        run(subtitle, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        const from = ticket.getBoundingClientRect();
        const to = target?.getBoundingClientRect();
        const dx = to ? to.left + to.width / 2 - (from.left + from.width / 2) : 0;
        const dy = to ? to.top + to.height / 2 - (from.top + from.height / 2) : 0;
        run(
          ticket,
          [
            { transform: 'none', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(25deg)`, opacity: 0.3 },
          ],
          { duration: FLIGHT_DURATION, easing: 'cubic-bezier(0.6, 0, 0.4, 1)', fill: 'forwards' },
        );
      });
      at(FLIGHT_START + FLIGHT_DURATION, () => {
        if (!target) return;
        const gold = getComputedStyle(document.documentElement).getPropertyValue('--color-gold').trim();
        target.animate(
          [
            { boxShadow: `0 0 0 0 ${gold}`, transform: 'scale(1)' },
            { boxShadow: '0 0 0 14px transparent', transform: 'scale(1.06)', offset: 0.4 },
            { boxShadow: '0 0 0 0 transparent', transform: 'scale(1)' },
          ],
          { duration: 700, easing: 'ease-out' },
        );
      });

      // 6. Tout s'efface.
      at(END, () => {
        run(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })
          .finished.then(finish)
          .catch(() => {});
      });
    });
  }

  /**
   * Fontaine de pièces et de symboles de code depuis le bas, puis feux d'artifice.
   * @param {HTMLCanvasElement} canvas
   * @returns {() => void} Arrête l'animation.
   */
  #particles(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);

    const css = getComputedStyle(document.documentElement);
    const color = (name) => css.getPropertyValue(`--color-${name}`).trim();
    const gold = { light: color('gold-light'), base: color('gold'), dark: color('gold-dark') };
    const sparkColors = [gold.light, gold.base, color('accent'), color('online'), color('ink')];

    let particles = [];
    // Lancer depuis le bas, assez fort pour monter jusqu'en haut de l'écran.
    const launch = (x, drift) => ({
      x,
      y: height + 20,
      vx: drift + (Math.random() - 0.5) * 10,
      vy: -(height * 0.017 + Math.random() * height * 0.013),
    });
    const coin = (position) => ({ kind: 'coin', ...position, size: 7 + Math.random() * 6, angle: Math.random() * Math.PI, spin: 0.12 + Math.random() * 0.2 });
    const addCoin = (x, drift = 0) => particles.push(coin(launch(x, drift)));
    // Pluie : pièces qui tombent du haut, plus doucement.
    const addRaindrop = () => particles.push(coin({ x: Math.random() * width, y: -20, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3 }));
    const addGlyph = (x) =>
      particles.push({
        kind: 'glyph',
        ...launch(x, 0),
        size: 14 + Math.random() * 10,
        glyph: pickRandom(CODE_GLYPHS),
        color: pickRandom([gold.light, gold.base, color('accent')]),
        angle: 0,
        spin: (Math.random() - 0.5) * 0.2,
      });
    const burst = () => {
      const x = width * (0.15 + Math.random() * 0.7);
      const y = height * (0.12 + Math.random() * 0.3);
      for (let index = 0; index < SPARKS_PER_BURST; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        const life = 60 + Math.random() * 50;
        particles.push({ kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color: pickRandom(sparkColors) });
      }
    };

    const drawCoin = (coin) => {
      // La pièce tourne sur elle-même : on l'écrase horizontalement.
      const squash = Math.max(Math.abs(Math.cos(coin.angle)), 0.08);
      context.save();
      context.translate(coin.x, coin.y);
      context.scale(squash, 1);
      context.beginPath();
      context.arc(0, 0, coin.size, 0, Math.PI * 2);
      context.fillStyle = gold.base;
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = gold.dark;
      context.stroke();
      context.beginPath();
      context.arc(0, 0, coin.size * 0.55, 0, Math.PI * 2);
      context.lineWidth = 1.5;
      context.strokeStyle = gold.light;
      context.stroke();
      context.restore();
    };
    const drawGlyph = (glyph) => {
      context.save();
      context.translate(glyph.x, glyph.y);
      context.rotate(glyph.angle);
      context.fillStyle = glyph.color;
      context.font = `bold ${glyph.size}px monospace`;
      context.fillText(glyph.glyph, 0, 0);
      context.restore();
    };
    const drawSpark = (spark) => {
      context.globalAlpha = spark.life / spark.maxLife;
      context.fillStyle = spark.color;
      context.fillRect(spark.x - 1.5, spark.y - 1.5, 3, 3);
      context.globalAlpha = 1;
    };

    const start = performance.now();
    let last = start;
    let nextBurst = 0;
    let frame = 0;
    let fountain = 0;
    // Vrai avec une probabilité donnée par image à 60 i/s, ajustée à la durée réelle de l'image.
    const chance = (probability, step) => Math.random() < Math.min(probability * step, 1);
    const loop = (now) => {
      const elapsed = now - start;
      // Pas de temps : 1 à 60 images par seconde, moins sur un écran plus rapide.
      const step = Math.min((now - last) / FRAME, MAX_STEP);
      last = now;

      if (elapsed < FOUNTAIN_END) {
        for (fountain += 2 * step; fountain >= 1; fountain -= 1) addCoin(width / 2 + (Math.random() - 0.5) * 80);
        if (chance(0.5, step)) addCoin(width * 0.06, 5);
        if (chance(0.5, step)) addCoin(width * 0.94, -5);
        if (chance(0.6, step)) addGlyph(width * Math.random());
      } else if (elapsed >= RAIN_START && elapsed < RAIN_END && chance(0.7, step)) {
        addRaindrop();
      }
      while (nextBurst < BURSTS.length && elapsed >= BURSTS[nextBurst]) {
        burst();
        nextBurst += 1;
      }

      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        if (particle.kind === 'spark') {
          particle.vx *= 0.97 ** step;
          particle.vy = particle.vy * 0.97 ** step + 0.05 * step;
          particle.life -= step;
        } else {
          particle.vy += GRAVITY * step;
          particle.angle += particle.spin * step;
        }
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
        if (particle.kind === 'coin') drawCoin(particle);
        else if (particle.kind === 'glyph') drawGlyph(particle);
        else drawSpark(particle);
      });
      particles = particles.filter((particle) =>
        particle.kind === 'spark' ? particle.life > 0 : particle.vy < 0 || particle.y < height + 40,
      );

      if (elapsed < END) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }
}
