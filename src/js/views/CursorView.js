const ROAR_CLASSES =
  'pointer-events-none fixed top-(--roar-y) left-(--roar-x) z-50 font-display text-2xl font-bold text-accent italic opacity-0 motion-safe:animate-roar motion-reduce:hidden';
// Durée de vie d'une bulle « RAWR! » (ms), un peu plus que son animation.
const ROAR_LIFETIME = 800;

/**
 * Curseur de la souris : passe en dinosaure quand l'easter egg est actif.
 * Le dessin des curseurs est dans le CSS (html[data-dino], src/css/main.css).
 */
export default class CursorView {
  #root = document.documentElement;

  /** @param {{ active: boolean }} state */
  render({ active }) {
    this.#root.toggleAttribute('data-dino', active);
  }

  /**
   * Clic gauche à la souris (pas au clavier ni au doigt).
   * @param {(x: number, y: number) => void} handler Position du clic dans la fenêtre.
   */
  bindClick(handler) {
    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button === 0) handler(event.clientX, event.clientY);
    });
  }

  /**
   * Bulle « RAWR! » qui surgit au point du clic puis s'envole.
   * @param {number} x
   * @param {number} y
   */
  roar(x, y) {
    const bubble = document.createElement('span');
    bubble.className = ROAR_CLASSES;
    bubble.setAttribute('aria-hidden', 'true');
    bubble.textContent = 'RAWR!';
    // Position calculée en JS, passée au CSS par des variables.
    bubble.style.setProperty('--roar-x', `${x}px`);
    bubble.style.setProperty('--roar-y', `${y}px`);
    document.body.append(bubble);
    setTimeout(() => bubble.remove(), ROAR_LIFETIME);
  }
}
