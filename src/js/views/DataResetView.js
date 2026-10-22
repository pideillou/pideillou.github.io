/**
 * Bouton « Effacer mes données de jeu » des mentions légales, avec une étape de confirmation.
 * Le bloc est caché sans JavaScript : sans JS, rien n'est enregistré, il n'y a rien à effacer.
 */
export default class DataResetView {
  #ask;
  #confirm;
  #question;
  #yes;
  #no;
  #status;

  /** @param {HTMLElement} root Bloc [data-reset]. */
  constructor(root) {
    const $ = (selector) => root.querySelector(selector);
    this.#ask = $('[data-reset-ask]');
    this.#confirm = $('[data-reset-confirm]');
    this.#question = $('#reset-question');
    this.#yes = $('[data-reset-yes]');
    this.#no = $('[data-reset-no]');
    this.#status = $('[data-reset-status]');
    root.hidden = false;
  }

  /** @param {{ onAsk: () => void, onConfirm: () => void, onCancel: () => void }} handlers */
  bind({ onAsk, onConfirm, onCancel }) {
    this.#ask.addEventListener('click', onAsk);
    this.#yes.addEventListener('click', onConfirm);
    this.#no.addEventListener('click', onCancel);
  }

  /** Affiche la question de confirmation et y place le focus. */
  askConfirmation() {
    this.#status.textContent = '';
    this.#ask.hidden = true;
    this.#confirm.hidden = false;
    this.#question.focus();
  }

  /** @param {string} message Résultat, annoncé aux lecteurs d'écran. */
  done(message) {
    this.#confirm.hidden = true;
    this.#ask.hidden = false;
    this.#ask.focus();
    this.#status.textContent = message;
  }
}
