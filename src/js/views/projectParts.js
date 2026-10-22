// Morceaux d'affichage communs aux projets : lien vers la fiche, visuel de couverture, étiquettes de compétences.
import { COVER_VIEWBOX, coverShapes } from '../utils/coverArt.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const COVER_CLASSES =
  'size-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-103';
// Étiquette d'une compétence ; data-match la colore quand elle a été tirée.
const CHIP_CLASSES =
  'rounded-full border border-muted/30 px-2.5 py-1 font-mono text-xs text-muted data-match:border-accent data-match:text-accent';

// Chemin relatif au site (images/…) : préfixé par la base de Vite (/).
const assetUrl = (src) => (/^(?:[a-z]+:|\/)/i.test(src) ? src : `${import.meta.env.BASE_URL}${src}`);

/**
 * @param {string} slug
 * @returns {string} Adresse de la fiche du projet (générée au build, voir build/projectPages.js).
 */
export const projectUrl = (slug) => `${import.meta.env.BASE_URL}projets/${slug}/`;

/**
 * Visuel du projet : son image si elle existe, sinon une illustration dessinée
 * selon sa catégorie, aux couleurs du thème actif.
 * @param {import('../models/ProjectModel.js').Project} project
 * @param {string} sizes Largeur affichée, pour que le navigateur choisisse la bonne image.
 * @returns {Element}
 */
export function createCover(project, sizes) {
  const { cover } = project;
  if (!cover) {
    const svg = svgNode({ tag: 'svg', attributes: { viewBox: COVER_VIEWBOX, preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }, className: COVER_CLASSES });
    svg.append(...coverShapes(project).map(svgNode));
    return svg;
  }

  const image = document.createElement('img');
  image.src = assetUrl(cover.src);
  if (cover.srcset?.length) {
    image.srcset = cover.srcset.map(({ src, width }) => `${assetUrl(src)} ${width}w`).join(', ');
    image.sizes = sizes;
  }
  image.alt = cover.alt ?? '';
  image.width = cover.width;
  image.height = cover.height;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.className = COVER_CLASSES;
  return image;
}

/**
 * @param {string[]} stack Compétences du projet.
 * @param {string[]} matches Celles qui ont été tirées.
 * @returns {HTMLLIElement[]}
 */
export function createSkillChips(stack, matches) {
  return stack.map((skill) => {
    const item = document.createElement('li');
    item.className = CHIP_CLASSES;
    item.textContent = skill;
    if (matches.includes(skill)) {
      item.toggleAttribute('data-match', true);
      const hint = document.createElement('span');
      hint.className = 'sr-only';
      hint.textContent = ' (tirée)';
      item.append(hint);
    }
    return item;
  });
}

/** @param {import('../utils/coverArt.js').Shape} shape */
function svgNode({ tag, attributes, className, children = [] }) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (className) node.setAttribute('class', className);
  node.append(...children.map(svgNode));
  return node;
}
