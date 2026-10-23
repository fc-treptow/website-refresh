// Standard-Vorschaubild für geteilte Links (Startseite und alle Seiten ohne eigenes Foto):
// das aktuelle Mannschaftsfoto der 1. Herren, also das Feld "image" in
// src/content/teams/de/herren-1.md. Tauscht die Redaktion das Foto im CMS, ändert sich die
// Vorschau automatisch mit. Wird von Base.astro und scripts/gen-og.mjs genutzt.
import { existsSync, readFileSync } from 'node:fs';

const fallback = '/images/team-h1.jpg';

export function defaultImage(root = process.cwd()) {
  try {
    const md = readFileSync(`${root}/src/content/teams/de/herren-1.md`, 'utf8');
    const m = md.match(/^image:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (!m) return fallback;
    const image = m[1].startsWith('/') ? m[1] : `/${m[1]}`;
    return existsSync(`${root}/public${image}`) ? image : fallback;
  } catch {
    return fallback;
  }
}
