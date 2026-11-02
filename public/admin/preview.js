// Aperçu du back-office : le panneau de droite montre le vrai site avec le contenu en cours de modification.
// La page du site s'ouvre avec « ?apercu » dans un cadre ; ce script lui envoie le contenu du fichier
// modifié par un BroadcastChannel (côté site : src/js/preview.js et src/js/services/PreviewService.js).
// La page se recharge à chaque modification. Elle peut aussi s'ouvrir dans un onglet, qui suit de la même façon.
// Chaque aperçu a son canal (« canal » dans l'adresse), pour que deux onglets du back-office ne se mélangent pas.
// API de Sveltia CMS : https://sveltiacms.app/en/docs/api/preview-templates
(() => {
  const { CMS, createClass, h } = window;

  // Fichiers de src/data/ (nom dans config.yml) et section de l'accueil montrée pour chacun.
  const SECTIONS = {
    projects: 'projets',
    profile: 'profil',
    education: 'parcours',
    skills: 'projets',
    contact: 'contact',
    seo: 'accueil',
    credits: 'accueil',
    changelog: 'accueil',
    rewards: 'accueil',
  };

  // Visuel choisi mais pas encore enregistré : il n'est pas encore sur le site, on passe son adresse temporaire (blob:).
  const withLocalImages = (data, getAsset) => {
    if (!Array.isArray(data.projects)) return data;
    const local = (src) => {
      const asset = src ? getAsset(src) : null;
      return asset?.fileObj ? asset.url : src;
    };
    return {
      ...data,
      projects: data.projects.map((project) =>
        project?.cover?.src
          ? { ...project, cover: { ...project.cover, src: local(project.cover.src), srcset: project.cover.srcset?.map((size) => ({ ...size, src: local(size.src) })) } }
          : project,
      ),
    };
  };

  const template = (file) =>
    createClass({
      getInitialState() {
        // page : « home », le slug d'un projet, ou null pour suivre le projet modifié.
        return { page: null, channel: Math.random().toString(36).slice(2, 10) };
      },

      componentDidMount() {
        this.channel = new BroadcastChannel(`portfolio:apercu:${this.state.channel}`);
        // Une page qui (re)démarre demande le contenu : on lui redonne le dernier envoyé.
        this.channel.addEventListener('message', ({ data }) => {
          if (data?.type === 'ready' && this.latest) this.channel.postMessage(this.latest);
        });
        this.send();
      },

      componentDidUpdate() {
        this.send();
      },

      componentWillUnmount() {
        this.channel.close();
      },

      data() {
        return withLocalImages(this.props.entry.get('data').toJS(), this.props.getAsset);
      },

      send() {
        this.latest = { type: 'content', file, data: this.data() };
        this.channel.postMessage(this.latest);
      },

      // Premier projet modifié depuis l'ouverture du fichier : sa fiche s'affiche d'elle-même.
      changedProject(projects) {
        const current = projects.map((project) => JSON.stringify(project));
        this.initial ??= current;
        return projects.find((project, index) => current[index] !== this.initial[index])?.slug || null;
      },

      render() {
        const projects = file === 'projects' ? (this.data().projects ?? []).filter((project) => project?.slug) : [];
        const page = file === 'projects' ? (this.state.page ?? this.changedProject(projects) ?? 'home') : 'home';
        const path = page === 'home' ? `/?apercu=${SECTIONS[file]}&` : `/projets/${page}/?apercu&`;
        const src = `${location.origin}${path}canal=${this.state.channel}`;

        return h(
          'div',
          { className: 'apercu' },
          h(
            'div',
            { className: 'apercu-barre' },
            file === 'projects'
              ? h(
                  'label',
                  null,
                  'Page : ',
                  h(
                    'select',
                    { value: this.state.page ?? 'auto', onChange: (event) => this.setState({ page: event.target.value === 'auto' ? null : event.target.value }) },
                    h('option', { value: 'auto' }, 'Projet modifié'),
                    h('option', { value: 'home' }, 'Accueil'),
                    projects.map((project) => h('option', { key: project.slug, value: project.slug }, project.title || project.slug)),
                  ),
                )
              : h('span', null, 'Aperçu du site'),
            h('a', { href: src, target: '_blank', rel: 'noopener' }, 'Ouvrir dans un onglet ↗'),
          ),
          // Nouvelle adresse (autre page) : nouveau cadre. Même adresse : le cadre reste et se recharge seul.
          h('iframe', { key: src, src, title: 'Aperçu du site avec les modifications' }),
        );
      },
    });

  Object.keys(SECTIONS).forEach((file) => CMS.registerPreviewTemplate(file, template(file)));

  CMS.registerPreviewStyle(
    `
    html, body { height: 100%; margin: 0; padding: 0; }
    .apercu { display: flex; flex-direction: column; height: 100vh; background: #0b0b1a; }
    .apercu-barre { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem;
      padding: 0.5rem 0.75rem; font: 14px/1.4 system-ui, sans-serif; color: #f4f4f8; }
    .apercu-barre select { max-width: 16rem; font: inherit; }
    .apercu-barre a { color: #ffcc00; }
    .apercu iframe { flex: 1; width: 100%; border: 0; background: #0b0b1a; }
    `,
    { raw: true },
  );
})();
