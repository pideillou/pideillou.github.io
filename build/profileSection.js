// Plugin Vite de la section « Profil » de l'accueil (HTML : src/js/render/profileSection.js).
import htmlSection from './htmlSection.js';
import { renderProfile } from '../src/js/render/profileSection.js';

export default function profileSection() {
  return htmlSection({
    name: 'portfolio-profile-section',
    placeholder: '<!-- profile:section -->',
    files: { profile: 'src/data/profile.json' },
    render: renderProfile,
  });
}
