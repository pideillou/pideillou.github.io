/**
 * Avatar de Paul (illustrations dans src/assets/avatar/) : lance son animation au bon moment
 * en posant data-on. L'animation elle-même est dans les classes (motion-safe : rien si animations réduites).
 */
export default class AvatarView {
  #root;

  /** @param {HTMLElement} root Image [data-avatar]. */
  constructor(root) {
    this.#root = root;
  }

  /** Joue l'animation maintenant (accueil : quand la machine à sous se ferme). */
  play() {
    this.#root.toggleAttribute('data-on', true);
  }

  /** Joue l'animation la première fois que l'avatar apparaît à l'écran (pied de page). */
  playWhenVisible() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        this.play();
      },
      { threshold: 0.6 },
    );
    observer.observe(this.#root);
  }
}
