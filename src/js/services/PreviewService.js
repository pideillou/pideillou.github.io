/**
 * Canal entre le back-office (/admin/, script public/admin/preview.js) et les pages du site
 * ouvertes en aperçu. Les deux sont sur la même origine : un BroadcastChannel suffit,
 * que la page soit dans le panneau d'aperçu ou dans un onglet à part.
 * Messages : { type: 'ready' } envoyé par la page, { type: 'content', file, data } par le back-office
 * (file : nom du fichier de src/data/ sans « .json », data : son contenu en cours de modification).
 * Chaque aperçu du back-office a son canal (paramètre « canal » de l'adresse) : deux onglets
 * du back-office ouverts en même temps ne se répondent pas l'un à l'autre.
 */
export default class PreviewService {
  #channel;

  /**
   * @param {string} id Identifiant du canal, donné par le back-office dans l'adresse.
   */
  constructor(id) {
    this.#channel = 'BroadcastChannel' in window ? new BroadcastChannel(`portfolio:apercu:${id}`) : null;
  }

  /**
   * Demande au back-office le contenu en cours de modification.
   * @param {number} timeout Attente maximale, en millisecondes.
   * @returns {Promise<{ file: string, data: object } | null>} null si aucun back-office ne répond.
   */
  request(timeout) {
    if (!this.#channel) return Promise.resolve(null);
    return new Promise((resolve) => {
      const done = (content) => {
        clearTimeout(timer);
        this.#channel.removeEventListener('message', onMessage);
        resolve(content);
      };
      const onMessage = ({ data }) => {
        if (data?.type === 'content') done(data);
      };
      const timer = setTimeout(() => done(null), timeout);
      this.#channel.addEventListener('message', onMessage);
      this.#channel.postMessage({ type: 'ready' });
    });
  }

  /**
   * @param {(content: { file: string, data: object }) => void} handler Appelé à chaque modification faite dans le back-office.
   */
  bindContent(handler) {
    this.#channel?.addEventListener('message', ({ data }) => {
      if (data?.type === 'content') handler(data);
    });
  }
}
