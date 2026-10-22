// Illustrations des projets sans image, dessinées selon leur catégorie (viewBox 320 × 200).
// Fonctions pures : elles décrivent les formes. Le navigateur (src/js/views/projectParts.js)
// et le build des fiches (build/projectPages.js) les dessinent chacun à leur façon.
import { seededRandom } from './random.js';

/**
 * @typedef {{ tag: string, attributes: Record<string, string | number>, className?: string, children?: Shape[] }} Shape
 */

export const COVER_VIEWBOX = '0 0 320 200';

const shape = (tag, attributes, className, children) => ({ tag, attributes, className, children });
const between = (random, min, max) => Math.round(min + random() * (max - min));
const frame = { 'stroke-width': 1.5 };

// Web : une fenêtre de navigateur avec un titre, un bouton et des cartes.
// Décalée vers la droite pour laisser le coin haut gauche au numéro du projet.
function drawWeb(random) {
  const highlight = between(random, 0, 2);
  return [
    shape('g', { transform: 'translate(14 6)' }, undefined, [
      shape('rect', { x: 32, y: 26, width: 256, height: 150, rx: 8, ...frame }, 'fill-surface stroke-muted/40'),
      shape('line', { x1: 32, y1: 46, x2: 288, y2: 46, ...frame }, 'stroke-muted/40'),
      shape('circle', { cx: 46, cy: 36, r: 3.5 }, 'fill-accent'),
      shape('circle', { cx: 58, cy: 36, r: 3.5 }, 'fill-muted/50'),
      shape('circle', { cx: 70, cy: 36, r: 3.5 }, 'fill-online'),
      shape('rect', { x: 92, y: 31, width: 140, height: 10, rx: 5 }, 'fill-ink/10'),
      shape('rect', { x: 50, y: 62, width: between(random, 100, 170), height: 12, rx: 3 }, 'fill-ink/80'),
      shape('rect', { x: 50, y: 82, width: between(random, 120, 200), height: 6, rx: 3 }, 'fill-muted/40'),
      shape('rect', { x: 50, y: 94, width: between(random, 80, 150), height: 6, rx: 3 }, 'fill-muted/40'),
      shape('rect', { x: 50, y: 110, width: 54, height: 14, rx: 7 }, 'fill-accent'),
      ...[0, 1, 2].map((i) =>
        shape('rect', { x: 50 + i * 76, y: 136, width: 68, height: 28, rx: 4 }, i === highlight ? 'fill-support/50' : 'fill-ink/10'),
      ),
    ]),
  ];
}

// UX : deux écrans de téléphone reliés par une flèche de parcours.
function drawUx(random) {
  const phone = (x, y, headerClass) => [
    shape('rect', { x, y, width: 78, height: 150, rx: 12, ...frame }, 'fill-surface stroke-muted/40'),
    shape('rect', { x: x + 29, y: y + 8, width: 20, height: 4, rx: 2 }, 'fill-muted/40'),
    shape('rect', { x: x + 10, y: y + 22, width: 58, height: 30, rx: 4 }, headerClass),
    ...[0, 1, 2].flatMap((i) => [
      shape('circle', { cx: x + 16, cy: y + 66 + i * 18, r: 5 }, 'fill-ink/20'),
      shape('rect', { x: x + 26, y: y + 63 + i * 18, width: between(random, 20, 42), height: 5, rx: 2.5 }, 'fill-muted/40'),
    ]),
    shape('rect', { x: x + 10, y: y + 128, width: 58, height: 10, rx: 5 }, 'fill-accent'),
  ];
  return [
    ...phone(66, 26, 'fill-accent/70'),
    ...phone(176, 24, 'fill-support/50'),
    shape('circle', { cx: 105, cy: 159, r: 10, ...frame }, 'fill-none stroke-accent/60'),
    shape('path', { d: 'M146 80 C 162 80 160 104 172 104', 'stroke-dasharray': '4 4', ...frame }, 'fill-none stroke-accent'),
    shape('path', { d: 'M166 99 L 172 104 L 166 109', ...frame }, 'fill-none stroke-accent'),
  ];
}

// Communication : une affiche devant une autre, et des formats pour les réseaux.
function drawCommunication(random) {
  const radius = between(random, 26, 36);
  const cx = between(random, 136, 168);
  const cy = between(random, 62, 84);
  const highlight = between(random, 0, 2);
  return [
    ...[0, 1, 2].map((i) =>
      shape('rect', { x: 40, y: 40 + i * 42, width: 32, height: 32, rx: 4 }, i === highlight ? 'fill-support/50' : 'fill-ink/10'),
    ),
    shape('rect', { x: 244, y: 50, width: 44, height: 80, rx: 6 }, 'fill-ink/10'),
    shape('rect', { x: 118, y: 22, width: 110, height: 156, rx: 3, transform: 'rotate(8 173 100)' }, 'fill-ink/10'),
    shape('rect', { x: 96, y: 18, width: 112, height: 164, rx: 3, ...frame }, 'fill-surface stroke-muted/40'),
    shape('rect', { x: 108, y: 30, width: 24, height: 4, rx: 2 }, 'fill-accent'),
    shape('circle', { cx, cy, r: radius }, 'fill-accent'),
    shape('circle', { cx: cx + radius * 0.7, cy: cy + radius * 0.6, r: 14 }, 'fill-support/60'),
    shape('rect', { x: 108, y: 128, width: between(random, 60, 88), height: 10, rx: 2 }, 'fill-ink/80'),
    shape('rect', { x: 108, y: 146, width: between(random, 40, 70), height: 6, rx: 3 }, 'fill-muted/40'),
    shape('rect', { x: 108, y: 158, width: 30, height: 6, rx: 3 }, 'fill-muted/40'),
  ];
}

// Audiovisuel : un lecteur vidéo et une piste de montage avec sa tête de lecture.
function drawAudiovisual(random) {
  const playhead = between(random, 90, 230);
  return [
    shape('rect', { x: 32, y: 20, width: 256, height: 120, rx: 6 }, 'fill-ink/10'),
    shape('circle', { cx: between(random, 80, 240), cy: 96, r: 22 }, 'fill-support/40'),
    shape('path', { d: 'M32 140 L 96 92 L 140 120 L 196 76 L 288 140 Z' }, 'fill-muted/20'),
    shape('circle', { cx: 274, cy: 34, r: 4 }, 'fill-accent'),
    shape('circle', { cx: 160, cy: 80, r: 18 }, 'fill-surface/80'),
    shape('path', { d: 'M154 70 L 170 80 L 154 90 Z' }, 'fill-accent'),
    ...Array.from({ length: 51 }, (_, i) => {
      const x = 34 + i * 5;
      const height = between(random, 4, 24);
      return shape('rect', { x, y: 180 - height, width: 3, height, rx: 1 }, x < playhead ? 'fill-accent' : 'fill-muted/40');
    }),
    shape('line', { x1: playhead, y1: 148, x2: playhead, y2: 184, ...frame }, 'stroke-ink'),
  ];
}

const DRAWINGS = { web: drawWeb, ux: drawUx, communication: drawCommunication, audiovisuel: drawAudiovisual };

/**
 * Formes de l'illustration d'un projet : toujours les mêmes pour un même projet.
 * @param {{ slug: string, category: string }} project
 * @returns {Shape[]}
 */
export function coverShapes(project) {
  const draw = DRAWINGS[project.category] ?? drawWeb;
  return draw(seededRandom(project.slug));
}
