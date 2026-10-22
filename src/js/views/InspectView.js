// Classes complètes des calques d'inspection (jamais construites dynamiquement).
const GRID_CLASSES = 'pointer-events-none fixed inset-0 z-40';
const GRID_INNER_CLASSES = 'mx-auto grid h-full max-w-6xl grid-cols-12 gap-6 px-4 md:px-8';
const COLUMN_CLASSES = 'border-x border-accent/30 bg-accent/5';
const BOX_CLASSES = 'pointer-events-none fixed z-40 hidden border border-accent bg-accent/10';
const LABEL_CLASSES =
  'pointer-events-none fixed z-40 hidden rounded-sm bg-accent px-1.5 py-0.5 font-mono text-2xs whitespace-nowrap text-surface';
const COLUMNS = 12;

/**
 * Mode inspection, comme le mode dev de Figma : grille de 12 colonnes,
 * et cadre avec les mesures de l'élément survolé (balise, taille, police).
 */
export default class InspectView {
  #layers = null;
  #onMove = (event) => this.#inspect(event.target);

  /** @returns {boolean} */
  get isActive() {
    return this.#layers !== null;
  }

  /** Active ou désactive le mode inspection. */
  toggle() {
    if (this.#layers) {
      this.#layers.forEach((layer) => layer.remove());
      this.#layers = null;
      document.removeEventListener('pointermove', this.#onMove);
      document.removeEventListener('pointerdown', this.#onMove);
      return;
    }

    const grid = document.createElement('div');
    grid.className = GRID_CLASSES;
    const inner = document.createElement('div');
    inner.className = GRID_INNER_CLASSES;
    inner.append(
      ...Array.from({ length: COLUMNS }, () => {
        const column = document.createElement('span');
        column.className = COLUMN_CLASSES;
        return column;
      }),
    );
    grid.append(inner);

    const box = document.createElement('div');
    box.className = BOX_CLASSES;
    const label = document.createElement('p');
    label.className = LABEL_CLASSES;
    this.#layers = [grid, box, label];
    this.#layers.forEach((layer) => layer.setAttribute('aria-hidden', 'true'));
    document.body.append(...this.#layers);

    document.addEventListener('pointermove', this.#onMove, { passive: true });
    document.addEventListener('pointerdown', this.#onMove, { passive: true });
  }

  /** @param {EventTarget | null} target */
  #inspect(target) {
    if (!(target instanceof Element) || target === document.body || target === document.documentElement) return;
    const [, box, label] = this.#layers;
    const rect = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    const font = `${style.fontFamily.split(',')[0].replaceAll('"', '')} ${Math.round(parseFloat(style.fontSize))}px`;

    // Position et taille calculées en JS : seule exception admise aux styles en ligne.
    Object.assign(box.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    label.textContent = `${target.tagName.toLowerCase()} · ${Math.round(rect.width)}×${Math.round(rect.height)} · ${font}`;
    Object.assign(label.style, {
      display: 'block',
      top: `${Math.max(rect.top - 22, 4)}px`,
      left: `${Math.max(rect.left, 4)}px`,
    });
  }
}
