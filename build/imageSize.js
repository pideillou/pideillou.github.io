// Dimensions d'une image lues dans son en-tête, sans dépendance : WebP, PNG, JPEG et SVG.
// Sert aux images envoyées depuis le back-office, qui arrivent sans largeur ni hauteur.
import { readFileSync } from 'node:fs';

/**
 * @param {string} file Chemin du fichier image.
 * @returns {{ width: number, height: number } | null} null si le format n'est pas reconnu.
 */
export default function imageSize(file) {
  const data = readFileSync(file);
  const ascii = (start, end) => data.toString('latin1', start, end);

  // WebP : conteneur RIFF, puis un bloc VP8X (étendu), VP8 (avec perte) ou VP8L (sans perte).
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8X') return { width: data.readUIntLE(24, 3) + 1, height: data.readUIntLE(27, 3) + 1 };
    if (chunk === 'VP8 ') return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = data.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }

  // PNG : la largeur et la hauteur suivent la signature et l'en-tête du bloc IHDR.
  if (data.readUInt32BE(0) === 0x89504e47) return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };

  // JPEG : on parcourt les segments jusqu'au premier marqueur SOF (début d'image).
  if (data.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < data.length) {
      const marker = data.readUInt16BE(offset);
      const isFrame = marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker);
      if (isFrame) return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) };
      offset += 2 + data.readUInt16BE(offset + 2);
    }
    return null;
  }

  // SVG : attributs width et height, sinon la viewBox.
  const svg = data.toString('utf8', 0, 2048).match(/<svg\b[^>]*>/i)?.[0];
  if (svg) {
    const attribute = (name) => Number.parseFloat(svg.match(new RegExp(`\\s${name}="([\\d.]+)`))?.[1]);
    const viewBox = svg.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
    const width = attribute('width') || Number(viewBox?.[1]);
    const height = attribute('height') || Number(viewBox?.[2]);
    if (width && height) return { width: Math.round(width), height: Math.round(height) };
  }
  return null;
}
