// Section « Contact » (formulaire en mode coop) et pied de page de l'accueil,
// fabriqués depuis src/data/contact.json et src/data/profile.json.
// Le formulaire marche sans JavaScript si un service d'envoi est configuré (« endpoint ») ;
// le JS ajoute la vérification des champs, l'enveloppe, les codes de récompense et le pigeon.
import htmlSection, { escape, pad } from './htmlSection.js';

const FILES = { contact: 'src/data/contact.json', profile: 'src/data/profile.json' };
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const LEGEND = 'flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase';
// Champs façon fiche de personnage : libellé de jeu, coins de viseur (accent quand le champ est actif ou en erreur),
// ▶ qui clignote dans le champ actif, ✓ quand le champ est bien rempli. Le focus se voit au trait du bas, aux coins et au ▶.
const LABEL = 'font-mono text-xs tracking-widest text-ink uppercase';
const HINT = 'tracking-normal text-muted normal-case';
const FRAME = 'group relative mt-2 frame-corners p-1 focus-within:corner-accent has-aria-invalid:corner-accent';
const FIELD =
  'block w-full rounded-sm border-b-2 border-muted/40 bg-ink/5 pl-10 text-base text-ink transition-colors placeholder:text-muted hover:border-muted focus:border-accent focus:outline-none aria-invalid:border-accent';
const CARET = 'pointer-events-none absolute left-5 font-mono text-sm text-accent opacity-0 group-focus-within:opacity-100 motion-safe:group-focus-within:animate-blink';
const VALID =
  'pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 scale-75 font-mono text-xs text-online opacity-0 data-on:scale-100 data-on:opacity-100 motion-safe:transition';
const ERROR = 'mt-2 flex gap-2 text-sm text-accent';
const FOOTER_TITLE = 'font-mono text-xs font-normal tracking-widest text-muted uppercase';
const FOOTER_LINK = `rounded text-muted transition-colors hover:text-ink ${FOCUS}`;
const CHIP = `min-h-9 rounded-full border border-muted/30 px-3 transition-colors hover:border-accent hover:text-accent ${FOCUS}`;

// Pigeon posé (symbole dans index.html), de la couleur du texte autour.
const pigeon = (className) => `<svg class="${className}" viewBox="0 0 64 48" aria-hidden="true"><use href="#pigeon"></use></svg>`;

/** Champ texte avec son libellé, son cadre et sa zone d'erreur (remplie par le JS). */
function renderField({ id, name, label, hint = '', optional = false, type = 'text', autocomplete, maxlength, extra = '', wide = false }) {
  const required = optional ? '' : ' required';
  const note = [hint, optional ? 'facultatif' : ''].filter(Boolean).join(', ');
  return `
            <div${wide ? ' class="sm:col-span-2"' : ''}>
              <label for="contact-${id}" class="${LABEL}">${label}${note ? ` <span class="${HINT}">· ${note}</span>` : ''}</label>
              <div class="${FRAME}">
                <span class="${CARET} top-1/2 -translate-y-1/2" aria-hidden="true">▶</span>
                <input id="contact-${id}" name="${name}" type="${type}" autocomplete="${autocomplete}" maxlength="${maxlength}"${required}${extra} aria-describedby="contact-${id}-error" data-contact-field="${name}" class="${FIELD} min-h-12 pr-20">
                <span data-contact-valid="${name}" class="${VALID}" aria-hidden="true">✓ +XP</span>
              </div>
              <p id="contact-${id}-error" data-contact-error="${name}" class="${ERROR}" hidden></p>
            </div>`;
}

function renderQuest(quest, index) {
  return `
            <label class="group relative flex cursor-pointer flex-col gap-1 rounded-xl border border-muted/30 p-4 transition-colors hover:border-accent has-checked:border-accent has-checked:bg-accent/10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
              <input type="radio" name="quest" value="${escape(quest.id)}" data-contact-field="quest" class="sr-only"${index === 0 ? ' checked' : ''}>
              <span class="font-mono text-2xs tracking-widest text-support uppercase group-has-checked:text-accent">${escape(quest.tag)}</span>
              <span class="font-display text-xl leading-tight text-ink">${escape(quest.label)}</span>
              <span class="absolute top-3 right-3 text-accent opacity-0 group-has-checked:opacity-100" aria-hidden="true">◆</span>
            </label>`;
}

// Adresse d'envoi sans JavaScript : le service configuré, sinon la messagerie du visiteur.
function formTarget({ endpoint, email }) {
  if (endpoint) return ` action="${escape(endpoint)}" method="post"`;
  if (email) return ` action="mailto:${escape(email)}" method="post" enctype="text/plain"`;
  return '';
}

function renderSection({ contact, profile }) {
  const [first] = contact.quests;
  return `<section id="contact" aria-labelledby="contact-title" class="relative scroll-mt-28 py-24">
      <!-- Coulisses de la section, révélées par la lampe (desktop) -->
      <div data-reveal class="pointer-events-none absolute inset-0 -z-10 hidden font-mono text-xs text-support mask-spotlight lg:pointer-fine:data-on:block" aria-hidden="true">
        <span class="absolute top-28 left-0">fetch(endpoint, { method: "POST" })</span>
        <span class="absolute top-36 left-0 text-muted">/* pigeon voyageur */</span>
        <span class="absolute top-28 right-0">input:focus-visible { outline: 2px; }</span>
        <span class="absolute bottom-8 left-0 text-accent">// les codes de récompense sont vérifiés, pas la peine de tricher</span>
      </div>

      <div class="grid gap-6 lg:grid-cols-section lg:items-end lg:gap-10">
        <p class="flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase lg:pb-3"><span class="text-accent">05</span><span>${contact.kicker
          .split(' · ')
          .map((part) => `<span data-scramble class="whitespace-nowrap">${escape(part)}</span>`)
          .join(' · ')}</span></p>
        <h2 id="contact-title" class="font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
          <span class="block">Rejoindre la partie,</span>
          <span class="block text-accent italic">en mode coop.</span>
        </h2>
        <div class="flex items-end gap-5 lg:flex-col lg:items-start lg:pb-3">
          <!-- Avatar qui tient la lettre, le pigeon sur l'épaule : c'est lui qui part à l'envoi -->
          <img src="/src/assets/avatar/letter-1x.webp" srcset="/src/assets/avatar/letter-1x.webp 1x, /src/assets/avatar/letter-2x.webp 2x" width="110" height="295" alt="" loading="lazy" decoding="async" class="h-40 w-auto shrink-0 lg:h-52">
          <p class="max-w-xs leading-relaxed text-muted">${escape(contact.intro)}</p>
        </div>
        <p class="flex items-center gap-2 font-mono text-xs text-support lg:col-start-2"><span class="text-accent" aria-hidden="true">◆</span>${escape(contact.response)}</p>
      </div>

      <div data-contact class="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div>
          <form data-contact-form${formTarget(contact)} novalidate aria-describedby="contact-privacy" class="flex flex-col gap-12">
            <fieldset>
              <legend class="${LEGEND}"><span class="text-accent">1</span>Choisis ta quête</legend>
              <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">${contact.quests.map(renderQuest).join('')}
              </div>
            </fieldset>

            <fieldset>
              <legend class="${LEGEND}"><span class="text-accent">2</span>Présente-toi</legend>
              <div class="mt-5 grid gap-6 sm:grid-cols-2">${renderField({ id: 'name', name: 'name', label: 'Nom du joueur', autocomplete: 'name', maxlength: 80 })}${renderField({
                id: 'email',
                name: 'email',
                label: 'Canal de contact',
                hint: 'ton e-mail',
                type: 'email',
                autocomplete: 'email',
                maxlength: 120,
                extra: ' inputmode="email" spellcheck="false"',
              })}${renderField({ id: 'organization', name: 'organization', label: 'Guilde', hint: 'ton entreprise ou ton école', optional: true, autocomplete: 'organization', maxlength: 100, wide: true })}
              </div>
            </fieldset>

            <fieldset>
              <legend class="${LEGEND}"><span class="text-accent">3</span>Écris ton message</legend>
              <div class="mt-5">
                <label for="contact-message" class="${LABEL}">Ton message</label>
                <div class="${FRAME}">
                  <span class="${CARET} top-4" aria-hidden="true">▶</span>
                  <textarea id="contact-message" name="message" rows="7" minlength="10" maxlength="${contact.maxLength}" required aria-describedby="contact-message-hint contact-message-error contact-codes" placeholder="${escape(first.placeholder)}" data-contact-field="message" class="${FIELD} min-h-40 resize-y py-3 pr-4 leading-relaxed"></textarea>
                </div>
                <p id="contact-message-error" data-contact-error="message" class="${ERROR}" hidden></p>
                <div class="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                  <p id="contact-message-hint" class="text-sm text-muted">Un code de récompense glissé dans le message est vérifié tout seul.</p>
                  <p class="flex items-center gap-3 font-mono text-xs text-muted" aria-hidden="true">
                    <span class="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted/20"><span data-contact-meter class="absolute inset-0 origin-left scale-x-(--fill) rounded-full bg-accent motion-safe:transition-transform"></span></span>
                    <span><span data-contact-count>0</span> / ${contact.maxLength}</span>
                  </p>
                </div>
                <ul id="contact-codes" data-contact-codes aria-live="polite" class="mt-4 flex flex-wrap gap-2 empty:hidden"></ul>
              </div>
            </fieldset>

            <!-- Piège à robots : invisible et ignoré par les lecteurs d'écran, seuls les robots le remplissent.
                 Nommé « _gotcha » pour que Formspree rejette aussi les robots qui envoient le formulaire sans JavaScript. -->
            <p class="sr-only" aria-hidden="true">
              <label for="contact-website">Ne pas remplir ce champ</label>
              <input id="contact-website" name="_gotcha" type="text" tabindex="-1" autocomplete="off" data-contact-field="website">
            </p>
            <input type="hidden" name="_subject" value="${escape(first.subject)}" data-contact-subject>

            <div class="flex flex-col gap-6 border-t border-muted/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p id="contact-privacy" class="max-w-md text-sm leading-relaxed text-muted">${escape(contact.privacy)}</p>
              <div class="flex flex-col items-start gap-2 sm:items-end">
                <button type="submit" data-contact-submit class="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent px-6 font-semibold text-surface transition-colors hover:bg-ink disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                  <span data-contact-submit-label>Envoyer le pigeon</span>
                  ${pigeon('w-7 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5')}
                </button>
                <p class="hidden font-mono text-xs text-muted pointer-fine:block">ou <kbd class="rounded border border-muted/40 px-1 text-2xs">Ctrl</kbd> + <kbd class="rounded border border-muted/40 px-1 text-2xs">Entrée</kbd></p>
              </div>
            </div>
            <p data-contact-status role="status" class="-mt-6 text-sm text-muted empty:hidden"></p>
          </form>

          <!-- Écran de réussite, affiché par le JS après l'envoi -->
          <div data-contact-success tabindex="-1" class="flex flex-col items-start gap-5 rounded-xl border border-accent/60 bg-accent/5 p-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" hidden>
            <p class="font-mono text-xs tracking-widest text-accent uppercase">Quête acceptée</p>
            <h3 class="font-display text-4xl leading-tight text-ink">Le pigeon est parti de Limoges.</h3>
            <p data-contact-success-text class="max-w-lg text-lg leading-relaxed text-muted"></p>
            <button type="button" data-contact-again class="inline-flex min-h-11 items-center gap-2 rounded-full border border-muted/40 px-5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent ${FOCUS}">Écrire un autre message</button>
          </div>
        </div>

        <!-- Enveloppe qui se remplit pendant la saisie (décorative : tout est déjà dans le formulaire) -->
        <div class="hidden lg:block" aria-hidden="true">
          <div class="sticky top-28">
            <p class="font-mono text-xs tracking-widest text-muted uppercase">Aperçu de l’enveloppe</p>
            <div data-contact-envelope class="relative mt-4 overflow-hidden rounded-lg border border-muted/30 bg-ink/5 p-6">
              <svg class="absolute inset-x-0 top-0 h-20 w-full text-muted/30" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 0L50 19L100 0" fill="none" stroke="currentColor" vector-effect="non-scaling-stroke"/></svg>
              <div class="relative flex items-start justify-between">
                <p class="flex size-18 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-dashed border-support font-mono text-2xs leading-tight text-support"><span>LIMOGES</span><span data-contact-date>87000</span></p>
                <p class="flex w-18 flex-col items-center gap-1 border-2 border-dotted border-accent bg-surface p-2">${pigeon('w-12 text-accent')}<span class="font-mono text-2xs text-accent">MMI · 87</span></p>
              </div>
              <dl class="relative mt-8 grid gap-3 font-mono text-xs">
                <div class="flex gap-3"><dt class="w-12 shrink-0 text-muted">À</dt><dd class="text-ink">${escape(profile.name)}, ${escape(profile.city.split(',')[0])}</dd></div>
                <div class="flex gap-3"><dt class="w-12 shrink-0 text-muted">De</dt><dd data-preview="name" class="truncate text-ink">Toi</dd></div>
                <div class="flex gap-3"><dt class="w-12 shrink-0 text-muted">Quête</dt><dd data-preview="quest" class="text-accent">${escape(first.label)}</dd></div>
              </dl>
              <p data-preview="message" class="relative mt-6 line-clamp-5 min-h-20 font-display text-lg leading-snug text-muted italic">Ton message s’écrit ici, au fil de la saisie.</p>
              <ul data-preview="codes" class="relative mt-4 flex flex-wrap gap-2 empty:hidden"></ul>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function renderFooter({ contact, profile }) {
  const year = new Date().getFullYear();
  const sections = [
    ['projets', 'Projets choisis'],
    ['tous-les-projets', 'Tous les projets'],
    ['profil', 'Profil'],
    ['parcours', 'Parcours'],
    ['contact', 'Contact'],
  ];
  const links = [
    ...contact.links.map(
      ({ label, url }) =>
        `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer" class="${FOOTER_LINK}">${escape(label)}<span class="sr-only"> (nouvel onglet)</span> <span aria-hidden="true">↗</span></a></li>`,
    ),
    ...(contact.email ? [`<li><a href="mailto:${escape(contact.email)}" class="${FOOTER_LINK}">${escape(contact.email)}</a></li>`] : []),
    `<li><a href="#contact" class="${FOOTER_LINK}">Le formulaire, juste au-dessus</a></li>`,
  ];
  // Score du visiteur : rempli par le JS (src/js/views/FooterView.js), caché sans JavaScript.
  const stats = [
    ['skills', 'Compétences vues'],
    ['secrets', 'Secrets trouvés'],
    ['levels', 'Fiches lues jusqu’au bout'],
  ];

  // pb-28 : de la place sous la dernière ligne pour la barre du terminal, fixée en bas à droite.
  return `<footer data-footer class="border-t border-muted/20">
    <div class="mx-auto max-w-6xl px-4 pt-16 pb-28 md:px-8">
      <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div class="flex items-end justify-between gap-6 lg:justify-start">
          <div class="min-w-0">
            <p class="flex items-center gap-3 font-mono text-xs tracking-widest text-muted uppercase"><span class="text-accent" aria-hidden="true">◆</span>Fin de la partie</p>
            <p class="mt-5 font-display text-5xl leading-none tracking-tight sm:text-6xl">Merci d’avoir joué.<span class="block text-accent italic">La suite au prochain niveau.</span></p>
          </div>
          <!-- Avatar qui fête la fin de partie : deux sauts quand il apparaît à l'écran (src/js/views/AvatarView.js) -->
          <img data-avatar="footer" src="/src/assets/avatar/cheers-1x.webp" srcset="/src/assets/avatar/cheers-1x.webp 1x, /src/assets/avatar/cheers-2x.webp 2x" width="144" height="288" alt="" loading="lazy" decoding="async" class="h-36 w-auto shrink-0 data-on:motion-safe:animate-cheer sm:h-48">
        </div>

        <section data-footer-score aria-labelledby="footer-score-title" class="rounded-xl border border-muted/30 p-5 font-mono text-xs" hidden>
          <h2 id="footer-score-title" class="flex items-center justify-between gap-4 font-normal tracking-widest text-muted uppercase">Ta partie<span class="text-accent normal-case"><span data-footer-stat="tokens">0</span> <span aria-hidden="true">◆</span><span class="sr-only">jetons</span></span></h2>
          <ul class="mt-5 grid gap-4">${stats
            .map(
              ([id, label]) => `
            <li>
              <p class="flex justify-between gap-4"><span class="text-muted">${label}</span><span data-footer-stat="${id}" class="text-ink tabular-nums">0</span></p>
              <span class="relative mt-2 block h-1 overflow-hidden rounded-full bg-muted/20" aria-hidden="true"><span data-footer-bar="${id}" class="absolute inset-0 origin-left scale-x-(--fill) rounded-full bg-accent motion-safe:transition-transform motion-safe:duration-500"></span></span>
            </li>`,
            )
            .join('')}
          </ul>
          <p class="mt-5 flex flex-wrap gap-2">
            <button type="button" data-footer-action="terminal" class="${CHIP}">Ouvrir le terminal</button>
            <button type="button" data-footer-action="credits" class="${CHIP}">Voir le générique</button>
          </p>
        </section>
      </div>

      <div class="mt-16 grid gap-10 border-t border-muted/20 pt-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div class="flex flex-col items-start gap-4">
          <a href="#accueil" class="flex items-center gap-3 rounded-full pr-2 ${FOCUS}">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-surface" aria-hidden="true">Pp</span>
            <span class="flex flex-col leading-tight"><span class="font-display font-bold">${escape(profile.name)}</span><span class="text-xs text-muted">Développeur &amp; designer</span></span>
          </a>
          <p class="max-w-xs text-sm leading-relaxed text-muted">${escape(profile.school)} à ${escape(profile.city.split(',')[0])}. Je code des interfaces et je les dessine aussi.</p>
        </div>

        <nav aria-labelledby="footer-nav-title">
          <h2 id="footer-nav-title" class="${FOOTER_TITLE}">Niveaux</h2>
          <ul class="mt-4 grid gap-2 text-sm">${sections
            .map(([id, label], i) => `<li><a href="#${id}" class="${FOOTER_LINK}"><span class="font-mono text-xs text-accent" aria-hidden="true">${pad(i + 1)}</span> ${label}</a></li>`)
            .join('')}</ul>
        </nav>

        <div>
          <h2 class="${FOOTER_TITLE}">Me retrouver</h2>
          <ul class="mt-4 grid gap-2 text-sm">${links.join('')}</ul>
        </div>

        <div>
          <h2 class="${FOOTER_TITLE}">Raccourcis</h2>
          <ul class="mt-4 grid gap-2 font-mono text-xs text-muted">
            <li><kbd class="rounded border border-muted/40 px-1 text-ink">Ctrl K</kbd> ouvrir le terminal</li>
            <li><span class="text-ink">help</span> voir les commandes</li>
            <li><span class="text-ink">theme</span> changer d’ambiance</li>
            <li><span class="text-ink">play snake</span> faire une pause</li>
          </ul>
        </div>
      </div>

      <div class="mt-16 flex flex-col gap-4 border-t border-muted/20 pt-8 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© ${year} ${escape(profile.name)} · Fait main à Limoges avec Vite, Tailwind CSS et JavaScript natif. · <a href="mentions-legales/" class="${FOOTER_LINK} underline decoration-accent underline-offset-4">Mentions légales</a></p>
        <a href="#accueil" class="group inline-flex min-h-11 items-center gap-2 self-start rounded-full text-ink transition-colors hover:text-accent sm:self-auto ${FOCUS}">Continuer ? Revenir au début<svg class="size-4 text-accent motion-safe:transition-transform motion-safe:group-hover:-translate-y-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 14V2M3 7l5-5 5 5"/></svg></a>
      </div>
    </div>
  </footer>`;
}

/** Plugin Vite de la section « Contact ». */
export default function contactSection() {
  return htmlSection({ name: 'portfolio-contact-section', placeholder: '<!-- contact:section -->', files: FILES, render: renderSection });
}

/** Plugin Vite du pied de page de l'accueil. */
export function siteFooter() {
  return htmlSection({ name: 'portfolio-site-footer', placeholder: '<!-- site:footer -->', files: FILES, render: renderFooter });
}
