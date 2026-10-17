// Verkleinert das Mannschaftsfoto jeder Mannschaft (Feld "image" in src/content/teams/de) für das
// Karussell auf der Startseite. Fotos aus dem CMS sind oft Handy-Originale mit mehreren MB; auf der
// Startseite landen stattdessen WebP-Dateien in zwei Breiten unter public/images/hero/.
// Läuft automatisch vor dev und build. Die Ausgabe ist nicht im Repository (.gitignore).
// Klappt die Umwandlung nicht, zeigt die Startseite das Originalfoto.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const dir = 'src/content/teams/de';
const out = 'public/images/hero';
const widths = [800, 1600];

mkdirSync(out, { recursive: true });

// manifest.json: je Mannschaft das Originalfoto und die erzeugten Dateien. Die Startseite liest
// es beim Build; ein Wechsel des Fotos im CMS wird daran erkannt.
const manifestPath = `${out}/manifest.json`;
let old = {};
try {
  old = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {}
const manifest = {};

for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  const m = readFileSync(`${dir}/${f}`, 'utf8').match(/^image:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (!m) continue;
  const image = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
  const src = `public${image}`;
  if (!existsSync(src)) {
    console.warn(`gen-hero: Foto für ${slug} nicht gefunden (${src})`);
    continue;
  }
  const srcTime = statSync(src).mtimeMs;
  const files = {};
  for (const w of widths) {
    const name = `${slug}-${w}.webp`;
    const target = `${out}/${name}`;
    const fresh = old[slug]?.image === image && existsSync(target) && statSync(target).mtimeMs >= srcTime;
    try {
      if (!fresh) await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 76 }).toFile(target);
      files[w] = `/images/hero/${name}`;
    } catch (e) {
      console.warn(`gen-hero: ${src} konnte nicht umgewandelt werden: ${e.message}`);
    }
  }
  if (Object.keys(files).length === widths.length) manifest[slug] = { image, files };
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
