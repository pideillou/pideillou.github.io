// Configuration de Vite : serveur de développement et build de production.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import projectPages from './build/projectPages.js';
import profileSection from './build/profileSection.js';
import educationSection from './build/educationSection.js';
import contactSection, { siteFooter } from './build/contactSection.js';
import seoHead from './build/seoHead.js';

export default defineConfig({
  // Le site sera servi sur https://pideillou.github.io/portfolio/ (GitHub Pages).
  base: '/portfolio/',
  // Plugins maison (dossier build/) : une fiche HTML par projet, les sections
  // « Profil », « Mon parcours » et « Contact » de l'accueil, son pied de page et son en-tête SEO, fabriqués depuis src/data/.
  plugins: [tailwindcss(), projectPages(), profileSection(), educationSection(), contactSection(), siteFooter(), seoHead()],
  build: {
    outDir: 'dist',
    // Pages : l'accueil, le gabarit des fiches projet (remplacé par une page par projet)
    // la page 404, que GitHub Pages affiche pour toute adresse inconnue, et les mentions légales.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        projet: resolve(import.meta.dirname, 'projet.html'),
        notfound: resolve(import.meta.dirname, '404.html'),
        legal: resolve(import.meta.dirname, 'mentions-legales/index.html'),
      },
    },
  },
});
