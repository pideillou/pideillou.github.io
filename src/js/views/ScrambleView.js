import { scrambleText } from '../utils/scramble.js';

// Durée d'un décodage (ms).
const DURATION = 600;

/**
 * Textes [data-scramble] qui se « décodent » caractère par caractère, façon terminal.
 * Le texte d'origine est remis à la fin de l'animation.
 * Accessibilité : chaque texte est coupé en deux. Une copie fixe, invisible à l'écran, est lue par
 * les lecteurs d'écran ; la copie visible, qui s'anime, leur est masquée (sinon ils liraient des lettres au hasard).
 */
export default class ScrambleView {
  #elements;
  #running = new WeakSet();
  /** @type {WeakMap<HTMLElement, { text: string, visible: HTMLElement }>} */
  #parts = new WeakMap();

  /** @param {ParentNode} root */
  constructor(root) {
    this.#elements = [...root.querySelectorAll('[data-scramble]')];
    this.#elements.forEach((element) => {
      const text = element.textContent;
      const spoken = document.createElement('span');
      spoken.className = 'sr-only';
      spoken.textContent = text;
      const visible = document.createElement('span');
      visible.setAttribute('aria-hidden', 'true');
      visible.textContent = text;
      element.replaceChildren(spoken, visible);
      this.#parts.set(element, { text, visible });
    });
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
    const parts = this.#parts.get(element);
    if (!parts || this.#running.has(element)) return;
    this.#running.add(element);

    const { text, visible } = parts;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min((now - start) / DURATION, 1);
      visible.textContent = progress < 1 ? scrambleText(text, progress) : text;
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
