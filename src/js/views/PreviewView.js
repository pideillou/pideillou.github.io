/**
 * Aperçu du back-office : remplace des morceaux de la page par le HTML fabriqué
 * avec le contenu en cours de modification, affiche un badge « Aperçu »,
 * garde la position de défilement d'un rechargement à l'autre.
 * Le HTML vient des fonctions de src/js/render/, les mêmes qu'au build : chaque texte y est échappé.
 */
const fragment = (html) => document.createRange().createContextualFragment(html);

// Cadre autour du texte qui vient d'être modifié (contour : la mise en page ne bouge pas).
const HIGHLIGHT = ['outline-4', 'outline-offset-4', 'outline-accent'];
const HIGHLIGHT_DURATION = 3000;
// En dessous, un texte en cours de saisie (« Mo ») se retrouverait partout : on ne cherche que l'égalité exacte.
const MIN_PARTIAL = 12;

const isVisible = (element) => element.getClientRects().length > 0;
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

/**
 * Premier élément visible qui affiche ce texte : celui d'un morceau de texte identique, sinon le plus petit
 * élément qui le contient (texte long, ou coupé en plusieurs morceaux), sinon un lien ou une image vers cette adresse.
 * @param {string} value
 * @returns {Element | undefined}
 */
function findText(value) {
  const text = normalize(value);
  const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
    const element = node.parentElement;
    if (normalize(node.data) !== text || element.closest('[data-preview-badge]')) continue;
    // Texte dans un onglet fermé (menu pause du profil) : on ouvre l'onglet, comme le ferait un clic.
    const panel = element.closest('[data-tab-panel][hidden]');
    if (panel) document.querySelector(`[data-tab="${CSS.escape(panel.dataset.tabPanel)}"]`)?.click();
    if (isVisible(element)) return element;
  }
  const elements = [...document.body.querySelectorAll('*:not(script, style, [data-preview-badge])')].filter(isVisible);
  if (text.length >= MIN_PARTIAL) {
    const containing = elements.filter((element) => normalize(element.textContent).includes(text));
    if (containing.length) return containing.reduce((a, b) => (b.textContent.length <= a.textContent.length ? b : a));
  }
  return elements.find((element) => element.getAttribute('href') === value || element.getAttribute('src') === value);
}

export default class PreviewView {
  #scroll;
  #saved;
  #badge = null;

  /**
   * @param {import('../services/StorageService.js').default} scroll Position de défilement et contenu affiché,
   *   gardés le temps d'un rechargement.
   */
  constructor(scroll) {
    this.#scroll = scroll;
    this.#saved = scroll.load(null);
    scroll.save(null);
  }

  /**
   * Remplace un élément de la page (une section de l'accueil, le pied de page).
   * @param {string} selector
   * @param {string} html
   */
  replace(selector, html) {
    document.querySelector(selector)?.replaceWith(fragment(html));
  }

  /**
   * Remplace tout le contenu de la page (fiche projet).
   * @param {string} html
   */
  replaceBody(html) {
    document.body.replaceChildren(fragment(html));
  }

  /**
   * @param {{ title: string, description: string }} head Titre de l'onglet et description pour Google.
   */
  setHead({ title, description }) {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }

  /**
   * @returns {boolean} false sur la page 404, qui sert de coque à la fiche d'un projet pas encore publié.
   */
  hasPublishedPage() {
    return !document.querySelector('[data-game-over]');
  }

  /**
   * Badge en bas à gauche, pour ne pas confondre l'aperçu avec le site en ligne.
   * @param {string} text
   */
  showBadge(text) {
    if (!this.#badge) {
      this.#badge = document.createElement('p');
      this.#badge.setAttribute('role', 'status');
      this.#badge.dataset.previewBadge = '';
      // Sur mobile, au-dessus de la barre du terminal, qui prend toute la largeur.
      this.#badge.className = 'pointer-events-none fixed bottom-18 left-4 z-50 sm:bottom-4 max-w-[calc(100%-2rem)] rounded-full bg-accent px-4 py-2 font-mono text-xs font-semibold text-surface shadow-lg';
      document.body.append(this.#badge);
    }
    this.#badge.textContent = text;
  }

  /**
   * Les liens vers d'autres pages du site restent en aperçu (fiche d'un projet, retour à l'accueil),
   * sur le même canal. Écoute en phase de capture : l'adresse est changée avant que la page ne suive le lien.
   */
  bindLinks() {
    const channel = new URLSearchParams(location.search).get('canal');
    window.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest?.('a[href]');
        if (!link || link.origin !== location.origin || link.pathname === location.pathname) return;
        const url = new URL(link.href);
        url.searchParams.set('apercu', '');
        if (channel) url.searchParams.set('canal', channel);
        link.href = url.href;
      },
      true,
    );
  }

  /**
   * @param {() => void} handler Appelé si le site plante (contenu en cours de saisie).
   */
  bindErrors(handler) {
    window.addEventListener('error', handler);
  }

  /**
   * Recharge la page à la même position (nouveau contenu reçu).
   * @param {string} shown Contenu affiché jusque-là (JSON), pour retrouver ensuite ce qui a changé.
   */
  reload(shown) {
    this.#scroll.save({ path: location.pathname, y: window.scrollY, shown });
    location.reload();
  }

  /** @returns {string | null} Contenu affiché avant le rechargement (JSON), sur cette même page. */
  get previousContent() {
    return this.#saved?.path === location.pathname ? (this.#saved.shown ?? null) : null;
  }

  /**
   * Une fois le site démarré : fait défiler jusqu'au texte modifié et l'entoure quelques secondes.
   * Sans texte visible à montrer : revient à la position d'avant le rechargement, sinon à la section demandée.
   * @param {string[]} texts Textes ou adresses qui viennent de changer.
   * @param {string} sectionId Section à montrer à la première ouverture (ex. « profil »).
   */
  reveal(texts, sectionId) {
    // Le défilement est géré ici : le navigateur ne doit pas remettre son ancienne position après coup.
    history.scrollRestoration = 'manual';
    // Polices chargées (les images ont leurs dimensions : la mise en page ne bougera plus),
    // puis site démarré (les cartes de projets sont dessinées par le JS de la page).
    document.fonts.ready.then(() => setTimeout(() => {
      const target = texts.map(findText).find(Boolean);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
        target.classList.add(...HIGHLIGHT);
        setTimeout(() => target.classList.remove(...HIGHLIGHT), HIGHLIGHT_DURATION);
      } else if (this.#saved?.path === location.pathname) {
        window.scrollTo({ top: this.#saved.y, behavior: 'instant' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
      }
    }));
  }
}
