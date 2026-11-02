// Plugin Vite de la section « Mon parcours » de l'accueil (HTML : src/js/render/educationSection.js).
import htmlSection from './htmlSection.js';
import { renderEducation } from '../src/js/render/educationSection.js';

export default function educationSection() {
  return htmlSection({
    name: 'portfolio-education-section',
    placeholder: '<!-- education:section -->',
    files: { education: 'src/data/education.json' },
    render: ({ education }) => renderEducation(education),
  });
}
