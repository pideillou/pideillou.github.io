// Au-delà, le service ne répond pas : on abandonne l'envoi (ms).
const TIMEOUT = 15_000;

/**
 * Envoi du formulaire de contact. Le site est statique (GitHub Pages) : le message part
 * vers un service de formulaire (Formspree ou équivalent, adresse « endpoint » de contact.json).
 * Sans service, on prépare un e-mail dans la messagerie du visiteur (adresse « email »).
 */
export default class ContactService {
  #endpoint;
  #email;

  /** @param {{ endpoint: string, email: string }} config */
  constructor({ endpoint, email }) {
    this.#endpoint = endpoint;
    this.#email = email;
  }

  /**
   * @param {Record<string, string>} payload
   * @returns {Promise<{ mailto: string | null }>} mailto : lien à ouvrir quand il n'y a pas de service.
   * @throws {Error} Message lisible par le visiteur.
   */
  async send(payload) {
    if (this.#endpoint) {
      await this.#post(payload);
      return { mailto: null };
    }
    if (this.#email) return { mailto: this.#mailto(payload) };
    throw new Error('Le formulaire n’est pas encore relié à une boîte mail. Repasse bientôt !');
  }

  /** @param {Record<string, string>} payload */
  async #post(payload) {
    let response;
    try {
      response = await fetch(this.#endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT),
      });
    } catch {
      throw new Error('Le pigeon n’a pas pu décoller : vérifie ta connexion, puis réessaie.');
    }
    if (!response.ok) {
      throw new Error('Le service d’envoi a refusé le message. Réessaie dans un instant.');
    }
  }

  /** @param {Record<string, string>} payload */
  #mailto({ _subject, quest, name, organization, message, codes }) {
    const body = [message, '', `Quête : ${quest}`, `De : ${name}${organization ? `, ${organization}` : ''}`, `Codes : ${codes}`].join('\n');
    return `mailto:${this.#email}?subject=${encodeURIComponent(_subject)}&body=${encodeURIComponent(body)}`;
  }
}
