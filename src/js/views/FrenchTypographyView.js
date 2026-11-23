// Applique la typographie française (src/js/utils/frenchTypography.js) aux textes de la page,
// puis à chaque texte ajouté ou changé ensuite par le JS (terminal, cartes, messages).
// Seuls les nœuds texte sont touchés : ni les attributs, ni les champs de saisie, ni le code.
import { frenchTypography, needsFrenchTypography } from '../utils/frenchTypography.js';

const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'KBD']);

export default class FrenchTypographyView {
  #observer;

  constructor(root = document.body) {
    this.#fixTree(root);
    this.#observer = new MutationObserver((records) => {
      records.forEach(({ type, target, addedNodes }) => {
        if (type === 'characterData') this.#fixText(target);
        else addedNodes.forEach((node) => this.#fixTree(node));
      });
    });
    this.#observer.observe(root, { childList: true, characterData: true, subtree: true });
  }

  #fixTree(node) {
    if (node.nodeType === Node.TEXT_NODE) return this.#fixText(node);
    if (node.nodeType !== Node.ELEMENT_NODE || SKIP.has(node.nodeName)) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) this.#fixText(walker.currentNode);
  }

  #fixText(text) {
    // La nouvelle valeur ne contient plus rien à corriger : l'observateur ne boucle pas.
    if (!needsFrenchTypography(text.data) || text.parentElement?.closest('script, style, code, pre, textarea, kbd')) return;
    text.data = frenchTypography(text.data);
  }
}
