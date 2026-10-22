// Adresse e-mail plausible : quelque chose, une arobase, un domaine avec un point.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;
const LIMITS = { name: 80, email: 120, organization: 100 };
const EMPTY = { quest: '', name: '', email: '', organization: '', message: '', website: '' };

// Comparaison souple des codes : sans accents, sans majuscules, espaces simplifiés.
const normalize = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ');

/**
 * @typedef {{ id: string, label: string, tag: string, subject: string, placeholder: string }} Quest
 * @typedef {{ code: string, title: string, unlocked: () => boolean }} RewardCode
 * @typedef {'idle' | 'sending' | 'sent' | 'error'} Status
 */

/**
 * Formulaire de contact : champs, vérification, codes de récompense glissés dans le message.
 * Le brouillon est gardé le temps de l'onglet (on le retrouve en revenant d'une fiche projet).
 * Émet « change » avec l'état complet.
 */
export default class ContactModel extends EventTarget {
  #quests;
  #codes;
  #maxLength;
  #storage;
  #fields;
  #errors = {};
  #status = /** @type {Status} */ ('idle');
  #error = '';

  /**
   * @param {{ quests: Quest[], codes: RewardCode[], maxLength: number }} options
   * @param {import('../services/StorageService.js').default} storage Brouillon (stockage de l'onglet).
   */
  constructor({ quests, codes, maxLength }, storage) {
    super();
    this.#quests = quests;
    this.#codes = codes;
    this.#maxLength = maxLength;
    this.#storage = storage;
    const draft = storage.load({});
    this.#fields = { ...EMPTY, quest: quests[0].id };
    for (const key of Object.keys(EMPTY)) {
      if (typeof draft[key] === 'string' && key !== 'website') this.#fields[key] = draft[key];
    }
    if (!this.#quest) this.#fields.quest = quests[0].id;
  }

  get #quest() {
    return this.#quests.find(({ id }) => id === this.#fields.quest);
  }

  /** Codes présents dans le message, et s'ils ont vraiment été débloqués par le visiteur. */
  get #found() {
    const message = normalize(this.#fields.message);
    return this.#codes
      .filter(({ code }) => message.includes(normalize(code)))
      .map(({ code, title, unlocked }) => ({ code, title, verified: unlocked() }));
  }

  /**
   * @returns {{ fields: typeof EMPTY, quest: Quest, codes: { code: string, title: string, verified: boolean }[],
   *   errors: Record<string, string>, valid: Record<string, boolean>, status: Status, error: string,
   *   length: number, maxLength: number }}
   *   valid : champs remplis et corrects (le ✓ de la fiche), selon les mêmes règles que l'envoi.
   */
  get state() {
    return {
      fields: { ...this.#fields },
      quest: this.#quest,
      codes: this.#found,
      errors: { ...this.#errors },
      valid: Object.fromEntries(['name', 'email', 'organization'].map((field) => [field, this.#fields[field].trim() !== '' && !this.#check(field)])),
      status: this.#status,
      error: this.#error,
      length: this.#fields.message.length,
      maxLength: this.#maxLength,
    };
  }

  /** Vrai si le champ piège a été rempli : c'est un robot. */
  get isBot() {
    return this.#fields.website.trim() !== '';
  }

  /** Données envoyées au service (les codes vérifiés sont signalés comme tels). */
  get payload() {
    const { name, email, organization, message } = this.#fields;
    const codes = this.#found.map(({ title, verified }) => `${title} (${verified ? 'vérifié' : 'non débloqué'})`);
    return {
      _subject: `${this.#quest.subject} · ${name.trim()}`,
      quest: this.#quest.label,
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim(),
      message: message.trim(),
      codes: codes.join(', ') || 'aucun',
    };
  }

  /**
   * @param {keyof typeof EMPTY} field
   * @param {string} value
   */
  update(field, value) {
    if (!(field in this.#fields)) return;
    this.#fields[field] = value;
    // Une erreur déjà affichée disparaît dès que le champ est corrigé.
    if (this.#errors[field]) {
      const error = this.#check(field);
      if (error) this.#errors[field] = error;
      else delete this.#errors[field];
    }
    if (this.#status === 'error') this.#setStatus('idle');
    this.#storage.save({ ...this.#fields, website: '' });
    this.#emit();
  }

  /**
   * Vérifie tous les champs et affiche les erreurs.
   * @returns {boolean} Vrai si le formulaire peut partir.
   */
  validate() {
    this.#errors = {};
    for (const field of ['name', 'email', 'message']) {
      const error = this.#check(field);
      if (error) this.#errors[field] = error;
    }
    this.#emit();
    return Object.keys(this.#errors).length === 0;
  }

  /** Envoi en cours. */
  sending() {
    this.#setStatus('sending');
  }

  /** Envoi réussi : le brouillon est effacé. */
  sent() {
    this.#storage.save({});
    this.#setStatus('sent');
  }

  /** @param {string} message Explication affichée au visiteur. */
  failed(message) {
    this.#error = message;
    this.#setStatus('error');
  }

  /** Nouveau message, formulaire vide (la quête choisie est gardée). */
  reset() {
    this.#fields = { ...EMPTY, quest: this.#fields.quest };
    this.#errors = {};
    this.#setStatus('idle');
  }

  /** @param {string} field */
  #check(field) {
    const value = this.#fields[field].trim();
    if (field === 'name') {
      if (!value) return 'Indique ton nom, pour que je sache à qui je réponds.';
      if (value.length > LIMITS.name) return `Ton nom dépasse ${LIMITS.name} caractères.`;
    }
    if (field === 'email') {
      if (!value) return 'Indique ton e-mail : c’est là que j’enverrai la réponse.';
      if (!EMAIL.test(value) || value.length > LIMITS.email) return 'Cet e-mail semble incomplet. Exemple : prenom@entreprise.fr';
    }
    if (field === 'organization' && value.length > LIMITS.organization) return `Le nom dépasse ${LIMITS.organization} caractères.`;
    if (field === 'message') {
      if (value.length < MIN_MESSAGE) return `Ton message est un peu court : ${MIN_MESSAGE} caractères minimum.`;
      if (value.length > this.#maxLength) return `Ton message dépasse ${this.#maxLength} caractères.`;
    }
    return '';
  }

  /** @param {Status} status */
  #setStatus(status) {
    this.#status = status;
    if (status !== 'error') this.#error = '';
    this.#emit();
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('change', { detail: this.state }));
  }
}
