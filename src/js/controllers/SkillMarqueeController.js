/**
 * Bandeau des outils : affiche les compétences et leurs logos.
 */
export default class SkillMarqueeController {
  /**
   * @param {{ name: string, logo?: string }[]} skills
   * @param {import('../views/SkillMarqueeView.js').default} view
   */
  constructor(skills, view) {
    view.render(skills);
  }
}
