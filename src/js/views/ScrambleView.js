import { scrambleText } from '../utils/scramble.js';

// Durée d'un décodage (ms).
const DURATION = 600;

/**
 * Textes [data-scramble] qui se « décodent » caractère par caractère, façon terminal.
 * Le texte d'origine est remis à la fin de l'animation.
 */
export default class ScrambleView {
  #elements;
  #running = new WeakSet();

  /** @param {ParentNode} root */
  constructor(root) {
    this.#elements = [...root.querySelectorAll('[data-scramble]')];
  }

  /** Décode tous les textes en même temps. */
  playAll() {
    this.#elements.forEach((element) => this.play(element));
  }

  /**
   * Décode un texte. Sans effet s'il est déjà en cours.
   * @param {HTMLElement} element
   */
  play(element) {
    if (this.#running.has(element)) return;
    this.#running.add(element);

    const text = element.dataset.scrambleText ?? element.textContent;
    element.dataset.scrambleText = text;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / DURATION, 1);
      element.textContent = progress < 1 ? scrambleText(text, progress) : text;
      if (progress < 1) requestAnimationFrame(frame);
      else this.#running.delete(element);
    };
    requestAnimationFrame(frame);
  }

  /**
   * Survol à la souris d'un texte décodable.
   * @param {(element: HTMLElement) => void} handler
   */
  bindHover(handler) {
    this.#elements.forEach((element) => {
      element.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') handler(element);
      });
    });
  }
}
