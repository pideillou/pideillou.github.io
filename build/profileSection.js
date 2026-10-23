// Section « Profil » de l'accueil, fabriquée depuis src/data/profile.json (champ about)
// à la place du commentaire <!-- profile:section --> d'index.html (voir build/htmlSection.js).
// Mise en scène : le menu pause d'un jeu. Chaque catégorie (loisirs, en ce moment, façon de
// travailler, hauts faits) est un onglet ; sans JS, elles s'affichent l'une sous l'autre.
import htmlSection, { escape, pad } from './htmlSection.js';

const TAB_CLASSES =
  'group flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left font-mono text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent aria-selected:bg-accent/10 aria-selected:text-ink';
// Case encore vide : elle dit quoi écrire.
const TODO = '<span class="shrink-0 rounded-full border border-dashed border-muted/60 px-2 py-0.5 font-mono text-2xs text-muted uppercase">À compléter</span>';

function renderItem({ title, text, todo }) {
  return `
                <li class="flex flex-col gap-1.5 rounded-lg border border-muted/30 bg-ink/5 p-4">
                  <p class="flex items-start justify-between gap-3"><span class="font-semibold text-ink"><span class="text-accent" aria-hidden="true">◆ </span>${escape(title)}</span>${todo ? TODO : ''}</p>
                  <p class="text-sm leading-relaxed text-muted">${escape(text)}</p>
                </li>`;
}

function renderPanel({ id, title, items }) {
  return `
            <div id="profil-${escape(id)}" data-tab-panel="${escape(id)}" class="flex flex-col gap-5 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent">
              <h3 class="font-display text-2xl leading-tight text-ink sm:text-3xl">${escape(title)}</h3>
              <ul class="grid gap-3 sm:grid-cols-2">${items.map(renderItem).join('')}
              </ul>
            </div>`;
}

function renderSection({ profile }) {
  const { intro, menu } = profile.about;
  const tabs = menu
    .map(
      ({ id, label }, i) =>
        `<button type="button" data-tab="${escape(id)}" class="${TAB_CLASSES}"><span class="text-accent opacity-0 group-aria-selected:opacity-100" aria-hidden="true">▶</span><span class="flex-1">${escape(label)}</span><span class="text-2xs text-muted" aria-hidden="true">${pad(i + 1)}</span></button>`,
    )
    .join('\n            ');

  return `<section id="profil" aria-labelledby="profil-title" class="relative scroll-mt-28 py-24">
      <!-- Coulisses de la section, révélées par la lampe (desktop) -->
      <div data-reveal class="pointer-events-none absolute inset-y-0 -inset-x-8 -z-10 hidden font-mono text-xs text-support mask-spotlight lg:pointer-fine:data-on:block" aria-hidden="true">
        <span class="absolute top-28 left-8">game.pause();</span>
        <span class="absolute top-36 left-8 text-muted">/* reprendre quand tu veux */</span>
        <span class="absolute top-28 right-8">fps: 60 <span class="text-muted">/* stable */</span></span>
        <span class="absolute bottom-8 left-8 text-accent">// options › son › café : max</span>
        <span class="absolute right-8 bottom-8">inventaire : 4 catégories</span>
        <!-- Marges -->
        <span class="absolute top-80 left-2 rotate-180 text-vertical">role="tablist"</span>
        <span class="absolute top-148 left-2 rotate-180 text-vertical text-accent">// pas game over, juste pause</span>
        <span class="absolute top-64 right-2 text-vertical">aria-selected="true"</span>
        <span class="absolute top-128 right-2 text-vertical">▶ reprendre <span class="text-muted">/* entrée */</span></span>
      </div>

      <div class="grid gap-6 lg:grid-cols-section lg:items-end lg:gap-10">
        <p class="flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase lg:pb-3"><span class="text-accent">03</span><span data-scramble>Hors écran</span></p>
        <h2 id="profil-title" class="font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
          <span class="block">Profil,</span>
          <span class="block text-accent italic">en mode pause.</span>
        </h2>
        <p class="max-w-xs leading-relaxed text-muted lg:pb-3">${escape(intro)}</p>
      </div>

      <!-- Menu pause : onglets activés par src/js/views/TabsView.js -->
      <div data-pause class="mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-xl border border-muted/30">
        <p class="flex items-center justify-between gap-4 border-b border-muted/30 px-5 py-3 font-mono text-xs tracking-widest text-muted uppercase">
          <span class="flex items-center gap-3"><span class="text-accent" aria-hidden="true">❚❚</span>Pause</span>
          <span>${menu.length} catégories</span>
        </p>
        <div class="grid md:grid-cols-[15rem_minmax(0,1fr)]">
          <div data-tabs-list hidden class="flex flex-col gap-1 border-b border-muted/30 p-3 md:border-r md:border-b-0">
            ${tabs}
          </div>
          <div class="flex flex-col gap-12 p-6 sm:p-8">${menu.map(renderPanel).join('')}
          </div>
        </div>
      </div>
    </section>`;
}

/** Plugin Vite de la section « Profil ». */
export default function profileSection() {
  return htmlSection({
    name: 'portfolio-profile-section',
    placeholder: '<!-- profile:section -->',
    files: { profile: 'src/data/profile.json' },
    render: renderSection,
  });
}
