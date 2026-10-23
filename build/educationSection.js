// Section « Mon parcours » de l'accueil, fabriquée depuis src/data/education.json
// à la place du commentaire <!-- education:section --> d'index.html (voir build/htmlSection.js).
// Mise en scène : une carte de niveaux de jeu vidéo. Un chemin relie les années
// (le lycée sert de tutoriel), un repère « Ici » sautille sur le niveau en cours,
// la suite est verrouillée.
import htmlSection, { escape, pad } from './htmlSection.js';

// Colonnes de la carte et des fiches de niveau, selon le nombre d'années (classes écrites en entier pour Tailwind).
const COLUMNS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
const CARD_COLUMNS = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' };

// Carte : 600 × 120 unités, étirée sur toute la largeur. Les niveaux alternent bas et haut ;
// ces hauteurs correspondent au centre des pastilles (size-12) dans un bandeau h-32.
const MAP_LOW = 97.5;
const MAP_HIGH = 22.5;

const ICONS = {
  // Drapeau planté : niveau terminé.
  flag: '<svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 18V3M5 4h10l-2.5 3.5L15 11H5"/></svg>',
  // Cadenas : niveau pas encore ouvert.
  lock: '<svg class="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>',
};

// Repère du niveau en cours, comme sur la carte d'un jeu.
const HERE = '<span class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 font-mono text-2xs font-semibold whitespace-nowrap text-surface motion-safe:animate-hop">Ici ▼</span>';

// Pastilles de la carte, selon l'état du niveau.
const NODES = {
  done: () => `<span class="flex size-12 items-center justify-center rounded-full border-2 border-accent bg-surface text-accent">${ICONS.flag}</span>`,
  current: (number) => `<span class="relative flex size-12 items-center justify-center rounded-full bg-accent font-mono text-sm font-bold text-surface"><span class="absolute inset-0 rounded-full bg-accent opacity-50 motion-safe:animate-ping"></span><span class="relative">${number}</span>${HERE}</span>`,
  next: () => `<span class="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-muted/60 bg-surface text-muted">${ICONS.lock}</span>`,
};

// Fiches de niveau et étiquettes d'état (les libellés de la capture de PIDEILLOU).
const CARDS = {
  done: 'border-muted/30',
  current: 'border-accent bg-accent/5',
  next: 'border-dashed border-muted/50',
};
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-2xs font-semibold tracking-widest uppercase';
const STATUSES = {
  done: `<span class="${CHIP} border-muted/40 text-muted"><span aria-hidden="true">✓</span>Validé</span>`,
  current: `<span class="${CHIP} border-accent text-accent"><span class="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" aria-hidden="true"></span>En cours</span>`,
  next: `<span class="${CHIP} border-dashed border-muted/60 text-muted">Prochaine étape</span>`,
};

// Chemin entre deux niveaux : plein jusqu'au présent, en pointillés vers ce qui reste à jouer.
function renderPath(steps) {
  const x = (i) => ((i + 0.5) / steps.length) * 600;
  const y = (i) => (i % 2 ? MAP_HIGH : MAP_LOW);
  return steps
    .slice(1)
    .map((step, k) => {
      const [x1, y1, x2, y2] = [x(k), y(k), x(k + 1), y(k + 1)];
      const middle = (x1 + x2) / 2;
      const future = step.status === 'next';
      return `<path d="M${x1} ${y1} C ${middle} ${y1} ${middle} ${y2} ${x2} ${y2}" fill="none" stroke-width="2" vector-effect="non-scaling-stroke" class="${future ? 'stroke-muted/60' : 'stroke-accent'}"${future ? ' stroke-dasharray="6 6"' : ''}></path>`;
    })
    .join('');
}

// Numéro de chaque étape : le tutoriel n'en a pas, les niveaux sont comptés après lui.
function levelLabels(steps) {
  let level = 0;
  return steps.map((step) => (step.tutorial ? 'Tutoriel' : `Niveau ${pad((level += 1))}`));
}

function renderMap(steps) {
  const labels = levelLabels(steps);
  const nodes = steps
    .map((step, i) => `<div class="flex justify-center ${i % 2 ? 'items-start' : 'items-end'}">${(NODES[step.status] ?? NODES.next)(labels[i].slice(-2))}</div>`)
    .join('');
  return `
        <!-- Carte des niveaux (décorative : les fiches en dessous portent l'information) -->
        <div class="relative mx-auto mt-16 h-32 w-full max-w-5xl lg:col-span-3" aria-hidden="true">
          <svg class="absolute inset-0 size-full" viewBox="0 0 600 120" preserveAspectRatio="none">${renderPath(steps)}</svg>
          <div class="relative grid h-full ${COLUMNS[steps.length] ?? COLUMNS[3]}">${nodes}</div>
        </div>`;
}

function renderCard(step, label) {
  return `
          <li class="flex flex-col gap-3 rounded-xl border p-6 ${CARDS[step.status] ?? CARDS.next}">
            <p class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-mono text-xs font-semibold tracking-widest text-accent uppercase">${label}</span>
              ${STATUSES[step.status] ?? ''}
            </p>
            <p class="font-mono text-xs text-support">${escape(step.years)}</p>
            <h3 class="font-display text-2xl leading-tight text-ink">${escape(step.title)}</h3>
            <p class="leading-relaxed text-muted">${escape(step.text)}</p>
          </li>`;
}

function renderSection({ kicker, world, intro, steps }) {
  const labels = levelLabels(steps);
  return `<section id="parcours" aria-labelledby="parcours-title" class="relative scroll-mt-28 py-24">
      <!-- Coulisses de la section, révélées par la lampe (desktop) -->
      <div data-reveal class="pointer-events-none absolute inset-y-0 -inset-x-8 -z-10 hidden font-mono text-xs text-support mask-spotlight lg:pointer-fine:data-on:block" aria-hidden="true">
        <span class="absolute top-28 left-8">while (curieux) niveau++;</span>
        <span class="absolute top-36 left-8 text-muted">/* sauvegarde automatique ✓ */</span>
        <span class="absolute top-28 right-8">checkpoint: atteint</span>
        <span class="absolute bottom-8 left-8 text-accent">// partie sauvegardée : on continue ?</span>
        <!-- Au-dessus de la carte du parcours -->
        <span class="absolute top-100 left-8">stroke-dasharray: 6 6; <span class="text-muted">/* le chemin */</span></span>
        <span class="absolute top-100 right-8 text-accent">// monde 1, presque fini</span>
        <!-- Marges -->
        <span class="absolute top-120 left-2 rotate-180 text-vertical">&lt;path d="M 0 0 C …"&gt;</span>
        <span class="absolute top-192 left-2 rotate-180 text-vertical">grid-template-columns: repeat(4, 1fr);</span>
        <span class="absolute top-264 left-2 rotate-180 text-vertical text-accent">// boss final : le stage</span>
        <span class="absolute top-156 right-2 text-vertical">XP += curiosité;</span>
        <span class="absolute top-228 right-2 text-vertical">niveau 03 : verrouillé <span class="text-muted">/* pour l'instant */</span></span>
      </div>

      <div class="grid gap-6 lg:grid-cols-section lg:items-end lg:gap-10">
        <p class="flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase lg:pb-3"><span class="text-accent">04</span><span>${kicker
          .split(' · ')
          // Un morceau par effet de décodage : la ligne ne peut se couper qu'au « · ».
          .map((part) => `<span data-scramble class="whitespace-nowrap">${escape(part)}</span>`)
          .join(' · ')}</span></p>
        <h2 id="parcours-title" class="font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
          <span class="block">Mon parcours,</span>
          <span class="block text-accent italic">niveau par niveau.</span>
        </h2>
        <p class="max-w-xs leading-relaxed text-muted lg:pb-3">${escape(intro)}</p>
        <p class="flex items-center gap-2 font-mono text-xs text-support lg:col-start-2"><span class="text-accent" aria-hidden="true">◆</span>${escape(world)}</p>
${renderMap(steps)}

        <ol class="mx-auto grid w-full max-w-5xl gap-4 md:gap-6 ${CARD_COLUMNS[steps.length] ?? CARD_COLUMNS[3]} lg:col-span-3">${steps.map((step, i) => renderCard(step, labels[i])).join('')}
        </ol>

        <p class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-muted lg:col-span-3">
          <span><span class="text-accent" aria-hidden="true">▶</span> Niveau suivant en préparation.</span>
          <a href="#contact" class="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Rejoindre la partie</a>
        </p>
      </div>
    </section>`;
}

/** Plugin Vite de la section « Mon parcours ». */
export default function educationSection() {
  return htmlSection({
    name: 'portfolio-education-section',
    placeholder: '<!-- education:section -->',
    files: { education: 'src/data/education.json' },
    render: ({ education }) => renderSection(education),
  });
}
