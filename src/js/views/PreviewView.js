/**
 * Aperçu du back-office : remplace des morceaux de la page par le HTML fabriqué
 * avec le contenu en cours de modification, affiche un badge « Aperçu »,
 * garde la position de défilement d'un rechargement à l'autre.
 * Le HTML vient des fonctions de src/js/render/, les mêmes qu'au build : chaque texte y est échappé.
 */
const fragment = (html) => document.createRange().createContextualFragment(html);

export default class PreviewView {
  #scroll;
  #badge = null;

  /**
   * @param {import('../services/StorageService.js').default} scroll Position de défilement, gardée le temps d'un rechargement.
   */
  constructor(scroll) {
    this.#scroll = scroll;
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

  /** Recharge la page à la même position (nouveau contenu reçu). */
  reload() {
    this.#scroll.save({ path: location.pathname, y: window.scrollY });
    location.reload();
  }

  /**
   * Après le chargement : revient à la position d'avant le rechargement, sinon à la section demandée.
   * @param {string} sectionId Section à montrer à la première ouverture (ex. « profil »).
   */
  restoreScroll(sectionId) {
    const saved = this.#scroll.load(null);
    this.#scroll.save(null);
    setTimeout(() => {
      if (saved?.path === location.pathname) window.scrollTo({ top: saved.y, behavior: 'instant' });
      else document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant' });
    });
  }
}
