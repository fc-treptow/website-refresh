import { readFileSync } from 'node:fs';

// Verkleinerte Fassungen der News-Fotos, erzeugt von scripts/gen-news-images.mjs.
// Fehlt eine (Skript nicht gelaufen, Foto defekt), wird das Original ausgeliefert.

type Entry = { width?: number; height?: number; files: Record<string, string> };

let manifest: Record<string, Entry> = {};
try {
  manifest = JSON.parse(readFileSync(`${process.cwd()}/public/images/news-gen/manifest.json`, 'utf8'));
} catch {}

export type NewsImage = { src: string; srcset?: string; width?: number; height?: number; full: string };

/** Bildquelle für <img>: kleine Fassung als src, beide Breiten im srcset, große für die Großansicht */
export function newsImage(path: string): NewsImage {
  const key = path.startsWith('/') ? path : `/${path}`;
  const m = manifest[key];
  if (!m) return { src: path, full: path };
  return {
    src: m.files['640'],
    srcset: `${m.files['640']} 640w, ${m.files['1600']} 1600w`,
    width: m.width,
    height: m.height,
    full: m.files['1600'],
  };
}

/** Nur die Attribute für ein Vorschaubild (src, srcset, width, height) */
export function thumbAttrs(path: string) {
  const { full: _full, ...attrs } = newsImage(path);
  return attrs;
}
