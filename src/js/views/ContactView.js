const SVG = 'http://www.w3.org/2000/svg';
// Durée du vol du pigeon (ms).
const FLIGHT_TIME = 1800;

// Codes de récompense repérés dans le message : vérifié ou non (table de classes complètes pour Tailwind).
const CODE_CLASSES = {
  verified: 'flex items-center gap-2 rounded-full border border-accent bg-accent/10 px-3 py-1 font-mono text-xs text-accent',
  locked: 'flex items-center gap-2 rounded-full border border-dashed border-muted/60 px-3 py-1 font-mono text-xs text-muted',
};
const STICKER_CLASSES = {
  verified: 'rotate-2 rounded border border-accent bg-surface px-2 py-1 font-mono text-2xs text-accent uppercase',
  locked: '-rotate-2 rounded border border-dashed border-muted/60 px-2 py-1 font-mono text-2xs text-muted uppercase line-through',
};
const FLIGHT_CLASSES = 'pointer-events-none fixed top-(--fly-y) left-(--fly-x) z-50 flex flex-col items-center text-accent';

/**
 * Formulaire de contact de l'accueil : saisie, erreurs, enveloppe d'aperçu, envoi et vol du pigeon.
 * Les données sont toujours écrites avec textContent.
 */
export default class ContactView {
  #form;
  #fields;
  #errors;
  #valid;
  #message;
  #subject;
  #count;
  #meter;
  #codes;
  #status;
  #submit;
  #submitLabel;
  #success;
  #successText;
  #again;
  #envelope;
  #preview;
  #reducedMotion;
  #shownStatus = 'idle';
  #shownCodes = '';

  /**
   * @param {HTMLElement} root Section #contact.
   * @param {{ reducedMotion: boolean }} options
   */
  constructor(root, { reducedMotion }) {
    const $ = (selector) => root.querySelector(selector);
    this.#reducedMotion = reducedMotion;
    this.#form = $('[data-contact-form]');
    this.#fields = [...root.querySelectorAll('[data-contact-field]')];
    this.#errors = Object.fromEntries([...root.querySelectorAll('[data-contact-error]')].map((el) => [el.dataset.contactError, el]));
    this.#valid = [...root.querySelectorAll('[data-contact-valid]')];
    this.#message = $('textarea[data-contact-field="message"]');
    this.#subject = $('[data-contact-subject]');
    this.#count = $('[data-contact-count]');
    this.#meter = $('[data-contact-meter]');
    this.#codes = $('[data-contact-codes]');
    this.#status = $('[data-contact-status]');
    this.#submit = $('[data-contact-submit]');
    this.#submitLabel = $('[data-contact-submit-label]');
    this.#success = $('[data-contact-success]');
    this.#successText = $('[data-contact-success-text]');
    this.#again = $('[data-contact-again]');
    this.#envelope = $('[data-contact-envelope]');
    this.#preview = Object.fromEntries([...root.querySelectorAll('[data-preview]')].map((el) => [el.dataset.preview, el]));

    // Cachet de la poste : la date du jour.
    const date = $('[data-contact-date]');
    if (date) date.textContent = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
  }

  /** @param {(field: string, value: string) => void} handler */
  bindInput(handler) {
    const send = (event) => {
      const field = event.target.closest('[data-contact-field]');
      if (field && (field.type !== 'radio' || field.checked)) handler(field.dataset.contactField, field.value);
    };
    this.#form.addEventListener('input', send);
    this.#form.addEventListener('change', send);
  }

  /** @param {() => void} handler Envoi demandé (bouton ou Ctrl + Entrée). */
  bindSubmit(handler) {
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler();
    });
    this.#form.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.#form.requestSubmit();
      }
    });
  }

  /** @param {() => void} handler « Écrire un autre message ». */
  bindAgain(handler) {
    this.#again.addEventListener('click', handler);
  }

  /** @param {string} text Texte de l'écran de réussite. */
  setSuccessText(text) {
    this.#successText.textContent = text;
  }

  /** Place le curseur dans le premier champ en erreur. */
  focusFirstError() {
    this.#fields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
  }

  /** @param {string} url Lien mailto: à ouvrir dans la messagerie du visiteur. */
  openMail(url) {
    window.location.href = url;
  }

  /** @param {import('../models/ContactModel.js').default['state']} state */
  render({ fields, quest, codes, errors, valid, status, error, length, maxLength }) {
    // Champs : remplis depuis le brouillon, ou vidés après un envoi.
    for (const field of this.#fields) {
      const value = fields[field.dataset.contactField] ?? '';
      if (field.type === 'radio') field.checked = field.value === value;
      else if (field.value !== value) field.value = value;
    }
    this.#message.placeholder = quest.placeholder;
    this.#subject.value = quest.subject;

    for (const [name, element] of Object.entries(this.#errors)) {
      const field = this.#fields.find((item) => item.dataset.contactField === name);
      element.hidden = !errors[name];
      element.textContent = errors[name] ? `⚠ ${errors[name]}` : '';
      if (errors[name]) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
    // ✓ décoratif : l'état du champ est déjà donné par les erreurs.
    for (const badge of this.#valid) badge.toggleAttribute('data-on', Boolean(valid[badge.dataset.contactValid]));

    this.#count.textContent = String(length);
    this.#meter.style.setProperty('--fill', String(Math.min(length / maxLength, 1)));
    this.#renderCodes(codes);
    this.#renderPreview(fields, quest, codes);
    this.#renderStatus(status, error);
  }

  /** @param {{ code: string, title: string, verified: boolean }[]} codes */
  #renderCodes(codes) {
    // Liste annoncée aux lecteurs d'écran : on ne la réécrit que si elle change.
    const key = codes.map(({ code, verified }) => `${code}:${verified}`).join('|');
    if (key === this.#shownCodes) return;
    this.#shownCodes = key;
    this.#codes.replaceChildren(
      ...codes.map(({ title, verified }) => {
        const item = document.createElement('li');
        item.className = verified ? CODE_CLASSES.verified : CODE_CLASSES.locked;
        item.textContent = verified
          ? `◆ Code « ${title} » vérifié : tu l’as bien débloqué.`
          : `◇ Code « ${title} » pas encore débloqué. Bien tenté !`;
        return item;
      }),
    );
  }

  #renderPreview(fields, quest, codes) {
    if (!this.#preview.name) return;
    this.#preview.name.textContent = fields.name.trim() || 'Toi';
    this.#preview.quest.textContent = quest.label;
    const message = fields.message.trim();
    this.#preview.message.textContent = message ? `« ${message} »` : 'Ton message s’écrit ici, au fil de la saisie.';
    this.#preview.codes.replaceChildren(
      ...codes.map(({ title, verified }) => {
        const sticker = document.createElement('li');
        sticker.className = verified ? STICKER_CLASSES.verified : STICKER_CLASSES.locked;
        sticker.textContent = verified ? `${title} ✓` : title;
        return sticker;
      }),
    );
  }

  #renderStatus(status, error) {
    const previous = this.#shownStatus;
    this.#shownStatus = status;
    const sending = status === 'sending';
    this.#submit.disabled = sending;
    this.#submitLabel.textContent = sending ? 'Le pigeon s’envole…' : 'Envoyer le pigeon';
    this.#status.textContent = sending ? 'Envoi en cours…' : status === 'error' ? `⚠ ${error}` : '';

    if (status === 'sent' && previous !== 'sent') {
      const from = this.#submit.getBoundingClientRect();
      this.#form.hidden = true;
      this.#success.hidden = false;
      this.#success.focus();
      if (!this.#reducedMotion) {
        this.#fly(from);
        this.#envelope?.animate(
          [{ transform: 'none', opacity: 1 }, { transform: 'translate(40%, -60%) rotate(8deg) scale(0.6)', opacity: 0 }],
          { duration: FLIGHT_TIME / 2, easing: 'ease-in', fill: 'forwards' },
        );
      }
    }
    if (status !== 'sent' && previous === 'sent') {
      this.#success.hidden = true;
      this.#form.hidden = false;
      this.#envelope?.getAnimations().forEach((animation) => animation.cancel());
      this.#fields.find((field) => field.dataset.contactField === 'name')?.focus();
    }
  }

  /**
   * Le pigeon de Limoges part du bouton avec l'enveloppe et s'envole hors de l'écran.
   * @param {DOMRect} from Position du bouton d'envoi.
   */
  #fly(from) {
    const flight = document.createElement('div');
    flight.className = FLIGHT_CLASSES;
    flight.setAttribute('aria-hidden', 'true');
    // Position de départ, calculée en JS : passée au CSS par des variables.
    flight.style.setProperty('--fly-x', `${from.left + from.width / 2 - 24}px`);
    flight.style.setProperty('--fly-y', `${from.top - 24}px`);

    const bird = document.createElementNS(SVG, 'svg');
    // Pas de classe fill-* : les reflets du dessin (sans couleur, donc noirs et transparents) doivent la garder.
    bird.setAttribute('viewBox', '0 0 64 48');
    bird.setAttribute('class', 'w-14');
    // Deux positions d'ailes qui alternent.
    for (const [id, className] of [['pigeon-up', 'animate-flap'], ['pigeon-down', 'animate-flap-alt']]) {
      const use = document.createElementNS(SVG, 'use');
      use.setAttribute('href', `#${id}`);
      use.setAttribute('class', className);
      bird.append(use);
    }
    const letter = document.createElement('span');
    letter.className = 'mt-0.5 block h-4 w-6 rounded-sm border-2 border-accent bg-surface';
    flight.append(bird, letter);
    document.body.append(flight);

    const right = window.innerWidth - from.left + 80;
    const up = from.top + 160;
    flight
      .animate(
        [
          { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
          { transform: 'translate(0, -24px) scale(1)', opacity: 1, offset: 0.15 },
          { transform: `translate(${right * 0.45}px, ${-up * 0.35}px) rotate(-6deg)`, offset: 0.6 },
          { transform: `translate(${right}px, ${-up}px) rotate(-14deg) scale(0.8)`, opacity: 1 },
        ],
        { duration: FLIGHT_TIME, easing: 'ease-in' },
      )
      // Animation coupée ou finie : le pigeon disparaît.
      .finished.catch(() => {})
      .then(() => flight.remove());
  }
}
