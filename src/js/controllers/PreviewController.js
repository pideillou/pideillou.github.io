import { normalizeProjectData } from '../utils/projectData.js';
import { renderProfile } from '../render/profileSection.js';
import { renderEducation } from '../render/educationSection.js';
import { renderContact, renderFooter } from '../render/contactSection.js';
import { renderBody, renderHead, sortProjects } from '../render/projectPage.js';

// Un visuel tout juste envoyé n'a pas encore de dimensions (lues dans le fichier au build) : 16:10 par défaut.
const DEFAULT_COVER_SIZE = { width: 1600, height: 1000 };
// Attente du back-office avant d'afficher le site publié (page ouverte sans back-office).
const TIMEOUT = 1500;
// Délai entre la dernière frappe et le rechargement de la page.
const DEBOUNCE = 500;

const BADGE = 'Aperçu · pas encore publié';
const BADGE_ERROR = 'Aperçu · un champ obligatoire est vide : version publiée affichée';
// Nouveau projet, sans fiche publiée à montrer à la place.
const BADGE_WAIT = 'Aperçu en attente · remplis les champs obligatoires (*) pour voir la fiche';

// Champs obligatoires d'un projet (public/admin/config.yml) : sans eux, l'accueil et les fiches plantent.
const REQUIRED = ['slug', 'title', 'summary', 'category', 'date', 'role'];

/** projects.json remis en forme, ou une erreur si un projet est incomplet (en cours de saisie). */
function readProjects(data) {
  const missing = data.projects.find((project) => REQUIRED.some((key) => !String(project?.[key] ?? '').trim()));
  if (missing) throw new Error(`Projet incomplet : ${missing?.title || missing?.slug || 'sans titre'}`);
  return normalizeProjectData(data, () => DEFAULT_COVER_SIZE);
}

// Remplace le contenu d'un objet de données en gardant l'objet : les modules qui l'importent voient le changement.
const replaceContent = (target, source) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, source);
};

/**
 * Aperçu du back-office : le site s'affiche avec le contenu en cours de modification.
 * Au chargement, le contenu reçu remplace celui du site (données importées et HTML fabriqué au build) ;
 * à chaque modification suivante, la page se recharge.
 */
export default class PreviewController {
  #service;
  #view;
  #data;
  #page;
  #shown = '';
  #timer;

  /**
   * @param {import('../services/PreviewService.js').default} service
   * @param {import('../views/PreviewView.js').default} view
   * @param {{ data: Record<string, object>, page: 'home' | 'project', slug?: string, section?: string, base: string }} options
   *   data : contenu de src/data/ importé par le site, par nom de fichier ; page : page à refaire ;
   *   slug : projet de la fiche ; section : section de l'accueil montrée à l'ouverture.
   */
  constructor(service, view, { data, page, slug, section, base }) {
    this.#service = service;
    this.#view = view;
    this.#data = data;
    this.#page = { type: page, slug, section, base };
  }

  /** Attend le contenu du back-office et l'applique, avant que le reste du site ne démarre. */
  async start() {
    const content = await this.#service.request(TIMEOUT);
    const applied = content && this.#apply(content);
    // Contenu reçu, même incomplet : la page ne se recharge que pour un contenu différent
    // (sinon deux aperçus ouverts se feraient recharger l'un l'autre sans fin).
    this.#shown = content ? JSON.stringify(content) : '';
    this.#view.showBadge(!content || applied ? BADGE : this.#view.hasPublishedPage() ? BADGE_ERROR : BADGE_WAIT);
    this.#view.bindLinks();
    this.#view.restoreScroll(this.#page.section);
    // Un champ vidé pendant la frappe peut faire planter le site : on le signale sans casser l'aperçu.
    this.#view.bindErrors(() => this.#view.showBadge(BADGE_ERROR));

    this.#service.bindContent((next) => {
      if (JSON.stringify(next) === this.#shown) return;
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.#view.reload(), DEBOUNCE);
    });
  }

  /**
   * Fabrique la page avec le contenu reçu, puis remplace données et HTML.
   * Tout est fabriqué avant de toucher à la page : en cas d'erreur, le site publié reste affiché.
   * @param {{ file: string, data: object }} content
   * @returns {boolean} false si le contenu est incomplet.
   */
  #apply({ file, data }) {
    if (!(file in this.#data)) return false;
    let next;
    let changes;
    try {
      next = { ...this.#data, [file]: file === 'projects' ? readProjects(data) : data };
      changes = this.#page.type === 'project' ? this.#projectPage(next) : this.#homePage(next);
    } catch (error) {
      console.warn('[aperçu] Contenu incomplet, version publiée affichée.', error);
      return false;
    }
    replaceContent(this.#data[file], next[file]);
    changes();
    return true;
  }

  #homePage({ profile, education, contact, seo }) {
    const html = {
      '#profil': renderProfile({ profile }),
      '#parcours': renderEducation(education),
      '#contact': renderContact({ contact, profile }),
      '[data-footer]': renderFooter({ contact, profile }),
    };
    return () => {
      Object.entries(html).forEach(([selector, section]) => this.#view.replace(selector, section));
      this.#view.setHead({ title: seo.title, description: seo.description });
    };
  }

  #projectPage({ projects, seo }) {
    const { slug } = this.#page;
    const list = sortProjects(projects);
    const project = list.find((item) => item.slug === slug);
    if (!project) throw new Error(`Projet introuvable : ${slug}`);
    const body = renderBody(project, list, this.#page.base);
    const { title } = renderHead(project, this.#page.base, seo);
    return () => {
      this.#view.replaceBody(body);
      this.#view.setHead({ title, description: project.summary });
    };
  }
}
