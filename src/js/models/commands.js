/**
 * Commandes du terminal. Les commandes « hidden » n'apparaissent pas dans l'aide :
 * ce sont les secrets, chacun rapporte un jeton la première fois.
 * Les actions sur la page (défilement, effets…) sont fournies par le contrôleur.
 */

/**
 * Identifiants des secrets (pour le compteur « secrets »).
 * « konami », « nuit », « veille », « jackpot » et « extinction » se déclenchent aussi sur la page.
 */
export const SECRETS = [
  'sudo', 'rm', 'coffee', 'matrix', 'vim', 'bonjour', 'xyzzy', '42',
  'ping', 'sl', 'cowsay', 'ssh', 'top', 'konami', 'nuit', 'veille', 'jackpot', 'extinction',
];

/**
 * @param {import('./TokenModel.js').default} tokens
 * @returns {string[]} Secrets déjà trouvés.
 */
export function foundSecrets(tokens) {
  return SECRETS.filter((id) => tokens.hasClaimed(`secret:${id}`));
}

/**
 * @param {import('./TokenModel.js').default} tokens
 * @param {boolean} [touch] Écran tactile sans souris : indices adaptés au doigt.
 * @returns {string | null} Indice du prochain secret à trouver, ou null s'ils sont tous trouvés.
 */
export function nextSecretHint(tokens, touch = false) {
  const found = foundSecrets(tokens);
  const next = SECRETS.find((id) => !found.includes(id));
  return next ? hintFor(next, touch) : null;
}

/**
 * Scores du visiteur, affichés à la fin du générique.
 * @param {import('./TokenModel.js').default} tokens
 * @param {{ dino: number, snake: number }} scores Records des jeux du terminal.
 * @returns {{ role: string, names: string[] }[]}
 */
export function playerStats(tokens, scores) {
  const best = (score) => (score > 0 ? `${score} point${score > 1 ? 's' : ''}` : 'pas encore joué');
  return [
    { role: 'Record au dino', names: [best(scores.dino)] },
    { role: 'Record au snake', names: [best(scores.snake)] },
    { role: 'Secrets trouvés', names: [`${foundSecrets(tokens).length} sur ${SECRETS.length}`] },
  ];
}

/**
 * Lignes affichées quand un secret est trouvé : le compteur, puis l'indice du secret suivant.
 * @param {import('./TokenModel.js').default} tokens
 * @param {boolean} [touch] Écran tactile sans souris : indices adaptés au doigt.
 * @returns {import('./TerminalModel.js').Line[]}
 */
export function secretFoundLines(tokens, touch = false) {
  const next = nextSecretHint(tokens, touch);
  return [
    { text: `★ secret trouvé (${foundSecrets(tokens).length}/${SECRETS.length}) · +1 jeton`, tone: 'accent' },
    ...(next ? [{ text: `Indice pour le suivant : ${next}`, tone: 'muted' }] : []),
  ];
}

// Phrases de la commande fortune.
const FORTUNES = [
  ['Moins, mais mieux.', 'Dieter Rams'],
  ['Il y a deux choses difficiles en informatique : invalider un cache et nommer les choses.', 'Phil Karlton'],
  ['Le design, ce n’est pas seulement l’apparence. Le design, c’est comment ça marche.', 'Steve Jobs'],
  ['Fais que ça marche, puis que ce soit juste, puis que ce soit rapide.', 'Kent Beck'],
  ['N’importe qui peut écrire du code qu’un ordinateur comprend. Les bons développeurs écrivent du code que les humains comprennent.', 'Martin Fowler'],
  ['La forme suit la fonction.', 'Louis Sullivan'],
  ['Les détails ne sont pas des détails. Ils font le design.', 'Charles Eames'],
  ['Le web est pour tout le monde.', 'Tim Berners-Lee'],
  ['Ça marche sur ma machine.', 'Tous les développeurs, un jour'],
];

// Ce qu'il faut faire pour débloquer chaque thème secret.
const UNLOCK_HINTS = {
  jackpot: 'il faut un jackpot',
  konami: 'un code légendaire du jeu vidéo',
};

// Indices donnés par « cat secrets.txt », un par secret pas encore trouvé.
const HINTS = {
  sudo: 'les admins ont un mot magique pour tout faire.',
  rm: 'il y a une commande très dangereuse à ne jamais taper. Enfin…',
  coffee: 'un développeur carbure à quoi, déjà ?',
  matrix: 'pilule rouge ou pilule bleue ?',
  vim: 'un éditeur dont personne ne sait sortir.',
  bonjour: 'la politesse, ça rapporte.',
  xyzzy: 'un mot magique des tout premiers jeux d’aventure.',
  42: 'la réponse à la grande question sur la vie, l’univers et le reste.',
  ping: 'demande au serveur s’il est réveillé.',
  sl: 'une faute de frappe sur ls, et un train passe.',
  cowsay: 'une vache qui parle, ça existe sous Linux.',
  ssh: 'connecte-toi à distance… à Limoges.',
  top: 'regarde ce qui tourne en ce moment sur le site.',
  konami: '↑ ↑ ↓ ↓ ← → ← → B A, sur la page.',
  nuit: 'reviens dans le terminal entre minuit et 5 h.',
  veille: 'laisse la souris tranquille pendant trois minutes.',
  jackpot: 'tape le mot que tout le monde espère à la machine à sous.',
  extinction: 'en mode dino, rugis encore et encore : le ciel finira par répondre.',
};

// Sur un écran tactile, ces secrets se trouvent autrement qu'au clavier et à la souris.
const TOUCH_HINTS = {
  konami: 'glisse le doigt ↑ ↑ ↓ ↓ ← → ← → sur la page, puis tape deux fois l’écran.',
  veille: 'pose ton téléphone trois minutes, sans laisser l’écran se verrouiller.',
  extinction: 'tape dino dans le terminal, puis touche l’écran encore et encore : le ciel finira par répondre.',
};

/**
 * @param {string} id Secret.
 * @param {boolean} touch Écran tactile sans souris.
 * @returns {string} Indice du secret, adapté à l'appareil.
 */
const hintFor = (id, touch) => (touch && TOUCH_HINTS[id]) || HINTS[id];

const DOT = '●';
const EMPTY_DOT = '○';

/**
 * @param {object} ctx
 * @param {{ name: string, user: string, school: string, city: string, dev: string[], design: string[], whoami: string[], cv: string }} ctx.profile
 * @param {{ date: string, message: string }[]} ctx.changelog
 * @param {string[]} ctx.sections Identifiants des sections de la page.
 * @param {() => string[]} ctx.getHistory
 * @param {() => void} ctx.clear
 * @param {import('./ThemeModel.js').default} ctx.theme
 * @param {import('./LampModel.js').default | null} ctx.lamp
 * @param {import('./EasterEggModel.js').default} ctx.dino
 * @param {import('./TokenModel.js').default} ctx.tokens
 * @param {import('./CollectionModel.js').default} ctx.collection
 * @param {import('./LevelModel.js').default} ctx.levels Fiches projet lues jusqu'au bout.
 * @param {import('./SlotMachineModel.js').default} ctx.slotMachine
 * @param {boolean} ctx.drawEnabled Faux si l'utilisateur a demandé moins d'animations.
 * @param {Record<'collection' | 'jackpot' | 'secrets', { title: string, text: string }>} ctx.rewards
 * @param {() => { dino: number, snake: number }} ctx.getBestScores Records des jeux.
 * @param {(lines: import('./TerminalModel.js').Line[]) => void} ctx.print Affiche des lignes plus tard (après une attente).
 * @param {import('./SoundModel.js').default} ctx.sound
 * @param {{ intro: string, episode: string, subtitle: string, crawl: string[],
 *   roles: { role: string, names: string[] }[], ending: string }} ctx.credits
 * @param {{ scrollTo: (id: string) => void, close: () => void, glitch: () => void, matrix: () => void,
 *   palette: () => { name: string, value: string }[], inspect: () => boolean, rec: () => boolean,
 *   play: (game: 'dino' | 'snake') => void, contrast: (a: string, b: string) => number,
 *   credits: () => boolean, copy: (text: string) => Promise<void>, shareUrl: (theme: string) => string,
 *   blip: () => void, effectsEnabled: boolean, hasMouse: boolean }} ctx.actions
 * @returns {Record<string, import('./TerminalModel.js').Command>}
 */
export function createCommands(ctx) {
  const { profile, tokens, actions } = ctx;
  let vimOpen = false;

  /** @returns {import('./TerminalModel.js').Line} */
  const line = (text, tone = 'default', href) => ({ text, tone, href });

  // Secret trouvé : un jeton la première fois, puis le compteur.
  const secret = (id) => {
    const isNew = !tokens.hasClaimed(`secret:${id}`);
    tokens.earn(`secret:${id}`);
    return isNew ? secretFoundLines(tokens, !actions.hasMouse) : [];
  };
  const found = () => foundSecrets(tokens);
  const check = (done) => (done ? '[x]' : '[ ]');

  const seconds = (ms) => `${Math.ceil(ms / 1000)} s`;

  const commands = {
    help: {
      description: 'liste des commandes',
      run: () => [
        line('Commandes disponibles :', 'muted'),
        ...Object.entries(commands)
          .filter(([, command]) => !command.hidden)
          .map(([name, command]) => line(`  ${(command.usage ?? name).padEnd(13)} ${command.description}`)),
        line('Tab complète, ↑ et ↓ parcourent l’historique. Il existe aussi des commandes secrètes…', 'muted'),
      ],
    },

    ls: {
      description: 'contenu du portfolio',
      run: () => [line(`${ctx.sections.map((id) => `${id}/`).join('  ')}  cv.pdf  secrets.txt`)],
    },

    cd: {
      description: 'aller à une section (cd projets)',
      complete: () => ctx.sections,
      run: ([target = '~']) => {
        const id = target.replace(/\/$/, '');
        if (['~', '..', '/', 'accueil'].includes(id)) {
          actions.scrollTo('accueil');
          return [];
        }
        if (!ctx.sections.includes(id)) return [line(`cd : ${target} : dossier introuvable`, 'error')];
        actions.scrollTo(id);
        return [];
      },
    },

    whoami: {
      description: 'qui je suis',
      run: () => profile.whoami.map((text) => line(text)),
    },

    neofetch: {
      description: 'fiche système du portfolio',
      run: () => {
        const logo = ['  ____  ', ' |  _ \\ ', ' | |_) |', ' |  __/ ', ' |_|    ', '        ', '        '];
        const info = [
          `${profile.user}@portfolio`,
          '-'.repeat(profile.user.length + 10),
          `Formation : ${profile.school}`,
          `Ville     : ${profile.city}`,
          `Dev       : ${profile.dev.join(', ')}`,
          `Design    : ${profile.design.join(', ')}`,
          `Thème     : ${ctx.theme.current}  ·  Jetons : ${tokens.state.tokens}`,
        ];
        return info.map((text, index) => line(`${logo[index]}   ${text}`, index === 0 ? 'accent' : 'default'));
      },
    },

    cat: {
      description: 'lire un fichier (cat secrets.txt)',
      complete: () => ['cv.pdf', 'secrets.txt'],
      run: ([file]) => {
        if (file === 'cv.pdf') {
          return profile.cv
            ? [line('Télécharger le CV', 'accent', profile.cv)]
            : [line('cv.pdf : bientôt disponible.', 'muted')];
        }
        if (file === 'secrets.txt') {
          const next = nextSecretHint(tokens, !actions.hasMouse);
          return [
            line(`Il y a ${SECRETS.length} secrets. Tu en as trouvé ${found().length}.`),
            next ? line(`Indice : ${next}`, 'muted') : line('Tu les as toutes trouvées. Chapeau.', 'success'),
          ];
        }
        return [line(`cat : ${file ?? ''} : fichier introuvable`, 'error')];
      },
    },

    hire: {
      usage: 'hire paul',
      description: 'm’embaucher (direction Contact)',
      complete: () => ['paul'],
      run: () => {
        actions.scrollTo('contact');
        return [line('Excellente décision. Direction la section Contact.', 'success')];
      },
    },

    contact: {
      description: 'me contacter',
      run: () => {
        actions.scrollTo('contact');
        return [line('Direction la section Contact.')];
      },
    },

    theme: {
      description: 'changer de thème (theme papier, theme random)',
      complete: () => [...ctx.theme.list.filter((item) => !item.locked).map((item) => item.id), 'random'],
      run: ([requested]) => {
        // « random » : un thème débloqué au hasard, différent de l'actuel.
        const choices = ctx.theme.list.filter((item) => !item.locked && item.id !== ctx.theme.current);
        const id = requested === 'random' ? choices[Math.floor(Math.random() * choices.length)]?.id : requested;
        if (!id) {
          return [
            line('Thèmes :', 'muted'),
            ...ctx.theme.list.map((item) =>
              line(
                `  ${item.id === ctx.theme.current ? '>' : ' '} ${item.id.padEnd(10)} ${item.locked ? `[verrouillé : ${UNLOCK_HINTS[item.unlock]}]` : item.label}`,
                item.id === ctx.theme.current ? 'accent' : 'default',
              ),
            ),
            line('Tape theme suivi du nom, ou theme random. Pour partager le thème : share.', 'muted'),
          ];
        }
        const status = ctx.theme.set(id);
        if (status === 'unknown') return [line(`theme : ${id} n’existe pas. Tape theme pour la liste.`, 'error')];
        if (status === 'locked') {
          const theme = ctx.theme.list.find((item) => item.id === id);
          return [line(`Thème verrouillé : ${UNLOCK_HINTS[theme.unlock]}.`, 'accent')];
        }
        return [line(`Thème ${id} appliqué.`, 'success')];
      },
    },

    tirage: {
      description: 'relancer la machine à sous (1 jeton)',
      run: () => {
        if (!ctx.drawEnabled) return [line('Machine à sous désactivée : ton système demande moins d’animations.', 'muted')];
        if (!tokens.spend()) {
          return [
            line(`Plus de jeton. Le prochain arrive dans ${seconds(tokens.state.nextIn)}.`, 'error'),
            line('Explore le site pour en gagner (tape jetons).', 'muted'),
          ];
        }
        ctx.slotMachine.spin();
        return [];
      },
    },

    collection: {
      description: 'compétences vues et récompenses',
      run: () => {
        if (!ctx.drawEnabled) return [line('Collection désactivée avec la machine à sous.', 'muted')];
        const state = ctx.collection.state;
        const lines = [
          line(`${state.skills.map((skill) => (skill.found ? DOT : EMPTY_DOT)).join('')}  ${state.found}/${state.total} compétences`),
          line(`Vues : ${state.skills.filter((skill) => skill.found).map((skill) => skill.name).join(', ') || 'aucune'}`, 'muted'),
          line(`Secrets : ${found().length}/${SECRETS.length}`, 'muted'),
        ];
        if (state.jackpot) lines.push(line(`★ ${ctx.rewards.jackpot.title} : ${ctx.rewards.jackpot.text}`, 'accent'));
        if (state.complete) lines.push(line(`★ ${ctx.rewards.collection.title} : ${ctx.rewards.collection.text}`, 'accent'));
        if (found().length === SECRETS.length) lines.push(line(`★ ${ctx.rewards.secrets.title} : ${ctx.rewards.secrets.text}`, 'accent'));
        return lines;
      },
    },

    jetons: {
      description: 'jetons et comment en gagner',
      run: () => {
        const { tokens: count, nextIn } = tokens.state;
        const bonus = [
          ['profil', 'visiter la section Profil'],
          ['projets', 'visiter la section Projets'],
          ['contact', 'visiter la section Contact'],
          ['lamp', 'allumer la lampe'],
          ['dino', 'trouver le dino'],
          ['message', 'm’envoyer un message'],
        ];
        return [
          line(`${'◆'.repeat(count)} ${count} jeton${count > 1 ? 's' : ''}${nextIn ? ` · +1 dans ${seconds(nextIn)}` : ''}`, 'accent'),
          line('Bonus (une fois chacun) :', 'muted'),
          ...bonus.map(([id, label]) => line(`  [${tokens.hasClaimed(id) ? 'x' : ' '}] ${label}`)),
          line(`  [${found().length}/${SECRETS.length}] secrets`),
        ];
      },
    },

    lampe: {
      description: 'allumer ou éteindre la lampe',
      complete: () => ['on', 'off'],
      run: ([state]) => {
        if (!ctx.lamp || !actions.hasMouse) return [line('La lampe a besoin d’une souris.', 'muted')];
        const wanted = state === 'on' ? true : state === 'off' ? false : !ctx.lamp.state.on;
        if (wanted !== ctx.lamp.state.on) ctx.lamp.toggle();
        return [line(wanted ? 'Lampe allumée : promène la souris sur le fond.' : 'Lampe éteinte.')];
      },
    },

    dino: {
      description: 'curseur dinosaure',
      run: () => {
        ctx.dino.toggle();
        return [line(ctx.dino.active ? 'Rawr. (retape dino pour revenir)' : 'Le dino retourne au Crétacé.')];
      },
    },

    git: {
      description: 'git log : nouveautés du site',
      complete: () => ['log'],
      run: ([sub]) => {
        if (sub !== 'log') return [line('Essaie git log.', 'muted')];
        return ctx.changelog.map((entry) => line(`${entry.date}  ${entry.message}`));
      },
    },

    history: {
      description: 'commandes déjà tapées',
      run: () => ctx.getHistory().map((entry, index) => line(`${String(index + 1).padStart(3)}  ${entry}`)),
    },

    echo: {
      description: 'répéter un texte',
      run: (args) => [line(args.join(' '))],
    },

    date: {
      description: 'date et heure',
      run: () => [line(new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }))],
    },

    clear: {
      description: 'vider l’écran',
      run: () => ctx.clear(),
    },

    exit: {
      description: 'fermer le terminal',
      run: () => actions.close(),
    },

    fortune: {
      description: 'une citation au hasard',
      run: () => {
        const [quote, author] = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        return [line(`« ${quote} »`), line(`  ${author}`, 'muted')];
      },
    },

    palette: {
      description: 'couleurs du thème et contrastes',
      run: () => {
        const colors = actions.palette();
        const surface = colors.find((color) => color.name === 'surface').value;
        return [
          line(`Thème ${ctx.theme.current}, contraste sur le fond :`, 'muted'),
          ...colors.map(({ name, value }) => {
            if (name === 'surface') return { ...line(`${name.padEnd(8)} ${value}   (fond)`), swatch: value };
            const ratio = actions.contrast(value, surface);
            const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA grand texte' : 'insuffisant';
            return { ...line(`${name.padEnd(8)} ${value}   ${ratio.toFixed(1)}:1 ${grade}`), swatch: value };
          }),
        ];
      },
    },

    inspect: {
      description: 'mode inspection, façon Figma',
      run: () => [
        actions.inspect()
          ? line('Inspection activée : survole un élément pour voir ses mesures. Retape inspect pour quitter.', 'success')
          : line('Inspection désactivée.'),
      ],
    },

    rec: {
      description: 'lancer ou couper l’enregistrement',
      run: () => [actions.rec() ? line('● REC : on tourne. Retape rec pour couper.', 'accent') : line('Coupez ! Enregistrement arrêté.')],
    },

    play: {
      description: 'jouer (play dino, play snake)',
      complete: () => ['dino', 'snake'],
      run: ([game]) => {
        // Les consignes s'affichent avant le jeu, qui s'insère juste en dessous.
        if (game === 'dino') {
          ctx.print([line('Espace, ↑ ou tapotement pour sauter. Échap pour quitter.', 'muted')]);
          actions.play('dino');
          return [];
        }
        if (game === 'snake') {
          ctx.print([line('Flèches (ou ZQSD), ou glisse le doigt pour diriger. Échap pour quitter.', 'muted')]);
          actions.play('snake');
          return [];
        }
        return [line('Jeux disponibles : play dino, play snake', 'muted')];
      },
    },

    credits: {
      description: 'le générique de fin',
      run: () => {
        if (actions.credits()) return [line('Moteur… action ! (Échap pour couper)', 'muted')];
        // Animations réduites : le générique en texte.
        const { intro, episode, subtitle, crawl, roles, thanks, ending } = ctx.credits;
        return [
          line(intro, 'muted'),
          line(`${episode} : ${subtitle}`.toUpperCase(), 'accent'),
          ...crawl.map((paragraph) => line(paragraph)),
          ...roles.map(({ role, names }) => line(`${role.padEnd(14)} ${names.join(', ')}`)),
          line(thanks.toUpperCase(), 'accent'),
          ...playerStats(tokens, ctx.getBestScores()).map(({ role, names }) => line(`${role.padEnd(16)} ${names.join(', ')}`)),
          line(ending, 'muted'),
        ];
      },
    },

    share: {
      description: 'copier un lien vers le site dans ce thème',
      run: () => {
        const url = actions.shareUrl(ctx.theme.current);
        actions
          .copy(url)
          .then(() => ctx.print([line('Lien copié dans le presse-papiers.', 'success')]))
          .catch(() => ctx.print([line('Copie impossible ici : sélectionne le lien à la main.', 'muted')]));
        return [line(url, 'accent', url)];
      },
    },

    son: {
      description: 'activer ou couper le son (son on, son off)',
      complete: () => ['on', 'off'],
      run: ([state]) => {
        if (state !== 'on' && state !== 'off') {
          return [line(`Son ${ctx.sound.on ? 'activé' : 'coupé'}. Tape son on ou son off.`, 'muted')];
        }
        ctx.sound.set(state === 'on');
        if (state === 'on') actions.blip();
        return [line(state === 'on' ? 'Son activé : le jackpot aura sa musique.' : 'Son coupé, même le dino se tait.', state === 'on' ? 'success' : 'default')];
      },
    },

    achievements: {
      description: 'succès débloqués',
      run: () => {
        const state = ctx.collection.state;
        const visited = ['profil', 'projets', 'contact'].filter((id) => tokens.hasClaimed(id)).length;
        const list = [
          [visited === 3, `Explorateur : visiter les 3 sections (${visited}/3)`],
          [tokens.hasClaimed('lamp'), 'Éclaireur : allumer la lampe'],
          [tokens.hasClaimed('dino'), 'Paléontologue : trouver le dino'],
          [state.jackpot, 'Chanceux : décrocher un jackpot'],
          [state.complete, `Collectionneur : voir les ${state.total} compétences (${state.found}/${state.total})`],
          [ctx.theme.triedCount >= 5, `Caméléon : essayer 5 thèmes (${Math.min(ctx.theme.triedCount, 5)}/5)`],
          [ctx.getBestScores().dino >= 100, `Sauteur : 100 points au jeu du dino (record : ${ctx.getBestScores().dino})`],
          [ctx.getBestScores().snake >= 10, `Charmeur : 10 points au snake (record : ${ctx.getBestScores().snake})`],
          [ctx.levels.state.complete, `Complétiste : lire toutes les fiches projet jusqu’au bout (${ctx.levels.state.count}/${ctx.levels.state.total})`],
          [tokens.hasClaimed('message'), 'Pigeon voyageur : m’envoyer un message'],
          [tokens.hasClaimed('credits'), 'Cinéphile : regarder le générique jusqu’au bout'],
          [tokens.hasClaimed('secret:konami'), 'Rétro : le code Konami'],
          [tokens.hasClaimed('secret:nuit'), 'Oiseau de nuit : passer entre minuit et 5 h'],
          [tokens.hasClaimed('secret:veille'), 'Insomniaque : réveiller l’économiseur d’écran'],
          [tokens.hasClaimed('secret:extinction'), 'Météorite : provoquer l’extinction des dinosaures'],
          [found().length === SECRETS.length, `Hacker : trouver tous les secrets (${found().length}/${SECRETS.length})`],
        ];
        const done = list.filter(([ok]) => ok).length;
        return [
          line(`${done}/${list.length} succès`, 'accent'),
          ...list.map(([ok, label]) => line(`  ${check(ok)} ${label}`, ok ? 'success' : 'default')),
        ];
      },
    },

    // Commandes secrètes, absentes de l'aide.
    jackpot: {
      hidden: true,
      run: () => [line('Bien tenté, tricheur. Le jackpot se mérite : tape tirage.', 'error'), ...secret('jackpot')],
    },

    ssh: {
      hidden: true,
      run: (args) => {
        const host = args[0] ?? 'paul@limoges';
        // Paul est en cours en semaine de 8 h à 17 h ; le reste du temps, la connexion passe.
        const now = new Date();
        const weekday = now.getDay() >= 1 && now.getDay() <= 5;
        const inClass = weekday && now.getHours() >= 8 && now.getHours() < 17;
        const answer = inClass
          ? [{ ...line('Connexion refusée : Paul est en cours. Réessaie après 17 h.', 'error'), pause: 300 }]
          : [
              { ...line(`Connexion établie. Bienvenue sur ${host}.`, 'success'), pause: 300 },
              line('Paul n’est pas en cours : c’est le bon moment pour lui écrire (tape hire paul).'),
            ];
        return [
          line(`Connexion à ${host}…`, 'muted'),
          { ...line('[###       ] 30 %'), pause: 400 },
          { ...line('[#######   ] 70 %'), pause: 500 },
          { ...line('[##########] 100 %'), pause: 500 },
          ...answer,
          ...secret('ssh'),
        ];
      },
    },

    top: {
      hidden: true,
      run: () => [
        line('  PID  PROCESSUS          CPU    MÉMOIRE', 'muted'),
        line('    1  cafe.exe           98 %   2,1 Go'),
        line('   42  curiosite          74 %   illimitée'),
        line('  128  design-system      31 %   512 Mo'),
        line('  256  machine-a-sous     12 %   64 Mo'),
        line('  512  sommeil.service     0 %   0 Mo (arrêté)', 'muted'),
        ...secret('top'),
      ],
    },

    sudo: {
      hidden: true,
      run: (args) => {
        const rest = args.join(' ');
        if (rest === 'admin') {
          return [line('Accès au back office : il arrive bientôt (Sveltia CMS, connexion GitHub).', 'muted')];
        }
        if (/^rm -rf \/?\*?$/.test(rest)) {
          actions.glitch();
          return [line('Suppression de / …', 'error'), line('Bien essayé. Le site est toujours là.'), ...secret('rm')];
        }
        return [line(`${profile.user} n’est pas dans le fichier sudoers. Cet incident sera signalé.`, 'error'), ...secret('sudo')];
      },
    },

    rm: {
      hidden: true,
      run: () => [line('rm : permission refusée. (avec sudo, peut-être… ou pas)', 'error')],
    },

    coffee: {
      hidden: true,
      run: () => [
        line('    ( (', 'muted'),
        line('     ) )', 'muted'),
        line('  ........'),
        line('  |      |]'),
        line('  \\      /'),
        line('   `----´'),
        line('Un café pour la route. Le code ira plus vite.'),
        ...secret('coffee'),
      ],
    },

    make: {
      hidden: true,
      run: ([what]) => (what === 'coffee' ? commands.coffee.run([], '') : [line(`make : rien à faire pour « ${what ?? ''} ».`, 'muted')]),
    },

    matrix: {
      hidden: true,
      run: () => {
        actions.matrix();
        return [line(actions.effectsEnabled ? 'Réveille-toi…' : 'Réveille-toi… (effet coupé : animations réduites)', 'success'), ...secret('matrix')];
      },
    },

    vim: {
      hidden: true,
      run: () => {
        vimOpen = true;
        return [line('Tu es entré dans vim. Bonne chance pour en sortir.', 'muted')];
      },
    },

    ':q': {
      hidden: true,
      run: () => {
        if (!vimOpen) return [line('Rien à quitter.', 'muted')];
        vimOpen = false;
        return [line('Tu as quitté vim. Rares sont ceux qui y arrivent.', 'success'), ...secret('vim')];
      },
    },

    bonjour: {
      hidden: true,
      run: () => [line('Bonjour à toi ! Content de te voir dans le terminal.'), ...secret('bonjour')],
    },

    xyzzy: {
      hidden: true,
      run: () => [line('Rien ne se passe.', 'muted'), ...secret('xyzzy')],
    },

    42: {
      hidden: true,
      run: () => [line('La réponse est 42. Reste à trouver la question.'), ...secret('42')],
    },

    ping: {
      hidden: true,
      run: () => [line('pong · 0,42 ms'), ...secret('ping')],
    },

    sl: {
      hidden: true,
      run: () => [
        line('      ====        ________'),
        line('  _D _|  |_______/        \\__I_I___'),
        line('   |(_)---  |   H\\________/ |   |'),
        line('   /     |  |   H  |  |     |   |'),
        line('  |      |  |   H  |__-----------|'),
        line('  Tu voulais taper ls, non ?', 'muted'),
        ...secret('sl'),
      ],
    },


    cowsay: {
      hidden: true,
      run: (args) => {
        const text = args.join(' ') || 'Meuh. Embauche Paul.';
        return [
          line(` ${'_'.repeat(text.length + 2)}`),
          line(`< ${text} >`),
          line(` ${'-'.repeat(text.length + 2)}`),
          line('        \\   ^__^'),
          line('         \\  (oo)\\_______'),
          line('            (__)\\       )\\/\\'),
          line('                ||----w |'),
          line('                ||     ||'),
          ...secret('cowsay'),
        ];
      },
    },
  };

  return commands;
}
