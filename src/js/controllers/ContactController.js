/**
 * Relie le formulaire de contact : saisie, vérification, envoi par le service.
 */
export default class ContactController {
  /**
   * @param {import('../models/ContactModel.js').default} model
   * @param {import('../views/ContactView.js').default} view
   * @param {import('../services/ContactService.js').default} service
   * @param {{ onSent: () => boolean }} options onSent : message parti, renvoie vrai si un jeton a été gagné.
   */
  constructor(model, view, service, { onSent }) {
    model.addEventListener('change', ({ detail }) => view.render(detail));
    view.bindInput((field, value) => model.update(field, value));
    view.bindAgain(() => model.reset());

    view.bindSubmit(async () => {
      if (model.state.status === 'sending') return;
      if (!model.validate()) {
        view.focusFirstError();
        return;
      }
      const { name } = model.payload;
      // Champ piège rempli : on fait comme si tout allait bien, sans rien envoyer.
      if (model.isBot) {
        view.setSuccessText(`Merci ${name}, message bien reçu.`);
        model.sent();
        return;
      }

      model.sending();
      try {
        const { mailto } = await service.send(model.payload);
        if (mailto) {
          view.setSuccessText(`Ta messagerie s’ouvre avec le message prêt, ${name} : il ne reste plus qu’à cliquer sur « Envoyer ».`);
          view.openMail(mailto);
        } else {
          const rewarded = onSent();
          view.setSuccessText(`Merci ${name} ! Ton message est en route. Je te réponds sous 48 h.${rewarded ? ' Au passage : +1 jeton.' : ''}`);
        }
        model.sent();
      } catch (error) {
        model.failed(error.message);
      }
    });

    view.render(model.state);
  }
}
