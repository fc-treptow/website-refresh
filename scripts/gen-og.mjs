// Vorschaubilder für geteilte Links (WhatsApp, Facebook, Signal, Telegram …).
// Fotos aus dem CMS sind oft Handy-Originale mit mehreren MB oder WebP. Beides zeigen manche
// Messenger nicht an: WhatsApp lässt große Bilder als Vorschau oft einfach weg. Deshalb entsteht
// hier für jedes Bild, das als Vorschau dient (Feld "image" bei News, Mannschaften und Shop,
// dazu das Standardbild), eine JPEG-Datei in 1200 × 630 (Seitenverhältnis 1,91 : 1) unter
// public/images/og/. Base.astro liest manifest.json und verweist auf diese Dateien.
// Läuft automatisch vor dev und build. Die Ausgabe ist nicht im Repository (.gitignore).
// Klappt die Umwandlung nicht, verweist die Seite auf das Originalfoto.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { defaultImage as currentDefault } from '../src/lib/defaultImage.mjs';

const out = 'public/images/og';
const width = 1200;
const height = 630;
// Standardbild für Seiten ohne eigenes Foto: aktuelles Foto der 1. Herren (wie in Base.astro)
const defaultImage = currentDefault();

// Fotos werden auf das Format zugeschnitten. Produktbilder im Shop dagegen ganz gezeigt,
// auf Papierfarbe (--color-paper), damit nichts vom Artikel abgeschnitten wird.
const sources = [
  { dir: 'src/content/news/de', fit: 'cover' },
  { dir: 'src/content/teams/de', fit: 'cover' },
  { dir: 'src/content/shop', fit: 'contain' },
];

mkdirSync(out, { recursive: true });

const manifestPath = `${out}/manifest.json`;
let old = {};
try {
  old = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {}
const manifest = {};

const images = new Map([[defaultImage, 'cover']]);
for (const { dir, fit } of sources) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    const m = readFileSync(`${dir}/${f}`, 'utf8').match(/^image:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (!m) continue;
    const image = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
    if (!images.has(image)) images.set(image, fit);
  }
}

for (const [image, fit] of images) {
  const src = `public${image}`;
  if (!existsSync(src)) {
    console.warn(`gen-og: Foto nicht gefunden (${src})`);
    continue;
  }
  // Dateiname aus dem Originalnamen plus kurzem Prüfwert, damit gleiche Namen in
  // verschiedenen Ordnern nicht kollidieren
  const base = image.split('/').pop().replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').slice(0, 60);
  const hash = createHash('sha1').update(`${image}|${fit}`).digest('hex').slice(0, 8);
  const name = `${base}-${hash}.jpg`;
  const target = `${out}/${name}`;
  const fresh = old[image]?.src === `/images/og/${name}` && existsSync(target) && statSync(target).mtimeMs >= statSync(src).mtimeMs;
  try {
    if (!fresh) {
      await sharp(src)
        .rotate()
        .resize({ width, height, fit, position: fit === 'cover' ? 'attention' : 'centre', background: '#f4f1ea' })
        .flatten({ background: '#f4f1ea' })
        .jpeg({ quality: 78, mozjpeg: true, progressive: true })
        .toFile(target);
    }
    manifest[image] = { src: `/images/og/${name}`, width, height };
  } catch (e) {
    console.warn(`gen-og: ${src} konnte nicht umgewandelt werden: ${e.message}`);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
