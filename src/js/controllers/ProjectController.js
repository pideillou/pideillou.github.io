/**
 * Relie la machine à sous aux sections de projets : chaque tirage (au chargement
 * ou par la commande « tirage ») distribue trois nouveaux projets, face cachée.
 * Les filtres de la liste passent aussi par ici.
 */
export default class ProjectController {
  #model;

  /**
   * @param {import('../models/ProjectModel.js').default} model
   * @param {{ featured: import('../views/FeaturedProjectsView.js').default,
   *   list: import('../views/ProjectListView.js').default }} views
   * @param {import('../models/SlotMachineModel.js').default} slotMachine
   */
  constructor(model, { featured, list }, slotMachine) {
    this.#model = model;
    model.addEventListener('change', ({ detail }) => {
      featured.render(detail);
      list.render(detail);
    });
    slotMachine.addEventListener('spin', ({ detail }) => {
      featured.deal();
      model.setDrawn(detail.result);
    });
    list.bindFilter((id) => model.setFilter(id));

    featured.render(model.state);
    list.render(model.state);
  }

  /**
   * Remet un tirage précédent, sans redistribuer les cartes (retour depuis une fiche).
   * @param {string[]} skills
   */
  restore(skills) {
    this.#model.setDrawn(skills);
  }
}
