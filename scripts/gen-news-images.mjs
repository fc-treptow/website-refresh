// Verkleinert die Fotos der News (Titelfoto "image" und Fotogalerie "gallery" in src/content/news/de).
// Fotos aus dem CMS sind oft Handy-Originale mit mehreren MB; eine Galerie mit 20 Fotos wäre auf
// dem Handy sonst schnell 40 MB. Ausgeliefert werden stattdessen WebP-Dateien in zwei Breiten
// unter public/images/news-gen/ (640 px für Vorschaubilder, 1600 px für die Großansicht).
// Läuft automatisch vor dev und build. Die Ausgabe ist nicht im Repository (.gitignore).
// Klappt die Umwandlung nicht, zeigt die Seite das Originalfoto (src/lib/newsImages.ts).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { parse } from 'yaml';

const dir = 'src/content/news/de';
const out = 'public/images/news-gen';
const widths = [640, 1600];

mkdirSync(out, { recursive: true });

const manifestPath = `${out}/manifest.json`;
let old = {};
try {
  old = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {}
const manifest = {};

// Alle Fotopfade aus den deutschen Beiträgen einsammeln
const images = new Set();
for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const m = readFileSync(`${dir}/${f}`, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  let fm;
  try {
    fm = parse(m[1]) ?? {};
  } catch (e) {
    console.warn(`gen-news-images: Frontmatter in ${f} nicht lesbar: ${e.message}`);
    continue;
  }
  if (typeof fm.image === 'string' && fm.image) images.add(fm.image);
  for (const g of fm.gallery ?? []) if (typeof g?.src === 'string' && g.src) images.add(g.src);
}

for (const raw of images) {
  const image = raw.startsWith('/') ? raw : `/${raw}`;
  if (image.endsWith('.svg') || image.endsWith('.gif')) continue;
  const src = `public${decodeURI(image)}`;
  if (!existsSync(src)) {
    console.warn(`gen-news-images: Foto nicht gefunden (${src})`);
    continue;
  }
  // Kurzer Fingerabdruck des Pfads, damit gleichnamige Fotos aus verschiedenen Ordnern nicht kollidieren
  const base =
    image
      .split('/')
      .pop()
      .replace(/\.[^.]+$/, '')
      .normalize('NFKD')
      .replace(/[^\w-]+/g, '-')
      .slice(0, 60) +
    '-' +
    createHash('sha256').update(image).digest('hex').slice(0, 6);
  const srcTime = statSync(src).mtimeMs;
  try {
    const meta = await sharp(src).rotate().metadata();
    // Nach dem Drehen (EXIF) sind Breite und Höhe ggf. vertauscht
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
    const files = {};
    for (const w of widths) {
      const name = `${base}-${w}.webp`;
      const target = `${out}/${name}`;
      const fresh = old[image] && existsSync(target) && statSync(target).mtimeMs >= srcTime;
      if (!fresh) await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 76 }).toFile(target);
      files[w] = `/images/news-gen/${name}`;
    }
    manifest[image] = { width, height, files };
  } catch (e) {
    console.warn(`gen-news-images: ${src} konnte nicht umgewandelt werden: ${e.message}`);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
