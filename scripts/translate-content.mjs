#!/usr/bin/env node
// Übersetzt die deutschen Inhalte (Mannschaften und News) mit DeepL in alle anderen Sprachen.
//
// Läuft automatisch in GitHub Actions (.github/workflows/translate.yml), sobald im CMS eine
// deutsche Mannschaft oder Neuigkeit gespeichert wird. Lokal:
//
//   DEEPL_API_KEY=… node scripts/translate-content.mjs            # nur Geändertes übersetzen
//   DEEPL_API_KEY=… node scripts/translate-content.mjs --force    # alles neu übersetzen
//   node scripts/translate-content.mjs --fingerprints-only        # nichts übersetzen, nur den
//                                                                 # aktuellen Stand als "passt" merken
//   node scripts/translate-content.mjs --dry-run                  # nur anzeigen, was passieren würde
//
// Wie entschieden wird, was neu übersetzt wird:
// Jede Übersetzungsdatei merkt sich unter "quelle" pro Feld einen Fingerabdruck des deutschen
// Textes, aus dem sie entstanden ist. Ein Feld wird nur neu übersetzt, wenn sich der deutsche
// Text seitdem geändert hat. Wer eine Übersetzung von Hand verbessert, verliert die Verbesserung
// also erst, wenn sich das deutsche Original dieses Feldes ändert.
//
// An DeepL gehen nur die öffentlichen Texte der Seite, keine Daten von Besucherinnen und Besuchern.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content');

// Sprache der Seite → Zielsprache bei DeepL. Englisch britisch, wie im Rest der Seite.
const targets = { en: 'EN-GB', tr: 'TR', ar: 'AR', es: 'ES', fr: 'FR' };

// Was pro Sammlung übersetzt (fields) und was unverändert übernommen wird (copy).
// Der Text unter dem Frontmatter (body) wird immer übersetzt.
// Mannschaften: Name, Liga, Trainingszeiten usw. kommen immer aus der deutschen Datei
// (src/i18n/content.ts), die Übersetzung braucht nur Kurzname, Bildunterschriften und Text.
// News: Die Übersetzung ersetzt den deutschen Eintrag komplett, deshalb wird alles mitkopiert.
const collections = [
  {
    dir: 'teams',
    fields: {
      shortName: (fm) => fm.shortName,
      galleryAlt: (fm) => (fm.gallery ?? []).map((g) => g?.alt ?? ''),
    },
    copy: [],
  },
  {
    dir: 'news',
    fields: { title: (fm) => fm.title, teaser: (fm) => fm.teaser },
    copy: ['date', 'tag', 'image'],
  },
];

const context =
  'Website of FC Treptow, an amateur football club in Berlin, Germany. Informal tone, addressing readers as "du". ' +
  'Keep proper names unchanged: league names such as "Kreisliga B", team names such as "River Plate", ' +
  'the ground "Willi-Sänger-Sportanlage", street names and people. "Herren I/II/III" are the club\'s men\'s teams.';

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');
const fingerprintsOnly = args.has('--fingerprints-only');
const mock = process.env.TRANSLATE_MOCK === '1'; // nur für Tests: "[EN-GB] Text" statt DeepL
const apiKey = process.env.DEEPL_API_KEY?.trim();

if (!apiKey && !mock && !fingerprintsOnly && !dryRun) {
  console.log('::warning::DEEPL_API_KEY fehlt. Es wird nichts übersetzt. Den Schlüssel in GitHub unter Settings → Secrets and variables → Actions als DEEPL_API_KEY hinterlegen.');
  process.exit(0);
}

// ---------- Frontmatter ----------

function readEntry(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw.trim() };
  return { fm: parse(m[1]) ?? {}, body: m[2].trim() };
}

function writeEntry(file, fm, body) {
  const yaml = stringify(fm, { lineWidth: 0 }).trimEnd();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `---\n${yaml}\n---\n${body ? `\n${body}\n` : ''}`);
}

const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && (v.length === 0 || v.every((x) => !x)));

// ---------- Markdown so verpacken, dass DeepL nur den Text anfasst ----------
// Listenzeichen und Überschriften-Rauten bleiben außen vor, Links, Bilder, Adressen und
// Formatierung werden zu XML-Tags, die DeepL unverändert zurückgibt.

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unescapeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function toXml(text) {
  // Bilder, Adressen und Link-Ziele werden gemerkt und durch Platzhalter ersetzt
  const originals = [];
  const ph = (orig) => `\u0000${originals.push(orig) - 1}\u0000`;
  let s = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, (m) => ph(m))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => `\u0001${originals.push(url) - 1}\u0002${label}\u0003`)
    .replace(/(?:https?:\/\/|www\.)[^\s)>\]]+|[\w.+-]+@[\w-]+\.[\w.-]+/g, (m) => ph(m));
  s = escapeXml(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])/g, '<i>$1</i>')
    .replace(/(?<![_\w])_(?!\s)(.+?)(?<!\s)_(?![_\w])/g, '<i>$1</i>')
    .replace(/\u0000(\d+)\u0000/g, '<x i="$1"/>')
    .replace(/\u0001(\d+)\u0002/g, '<a i="$1">')
    .replace(/\u0003/g, '</a>');
  return { xml: s, originals };
}

function fromXml(xml, originals) {
  const s = xml
    .replace(/<x i="(\d+)"\s*\/>|<x i="(\d+)"\s*><\/x>/g, (_, a, b) => `\u0000${a ?? b}\u0000`)
    .replace(/<a i="(\d+)">([\s\S]*?)<\/a>/g, (_, i, label) => `\u0001${label}\u0002${i}\u0003`)
    .replace(/<\/?b>/g, '**')
    .replace(/<\/?i>/g, '*');
  return unescapeXml(s)
    .replace(/\u0000(\d+)\u0000/g, (_, i) => originals[Number(i)])
    .replace(/\u0001([\s\S]*?)\u0002(\d+)\u0003/g, (_, label, i) => `[${label}](${originals[Number(i)]})`);
}

// Zerlegt einen Markdown-Text in übersetzbare Stücke (eine Zeile = ein Stück) und setzt ihn
// nach der Übersetzung wieder zusammen. Leere Zeilen, Code und reine Platzhalter bleiben.
function splitMarkdown(md) {
  const lines = md.split('\n');
  const parts = [];
  let inCode = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inCode = !inCode;
    const m = line.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)*)(.*)$/);
    const prefix = m[1];
    const text = m[2];
    // Nur Zeilen mit echtem Text übersetzen (eine Zeile, die nur ein Bild ist, bleibt wie sie ist)
    const plain = toXml(text).xml.replace(/<[^>]+>/g, '');
    if (inCode || /^\s*```/.test(line) || !/\p{L}/u.test(plain)) parts.push({ fixed: line });
    else parts.push({ prefix, text });
  }
  return parts;
}

// ---------- DeepL ----------

async function deepl(texts, target) {
  if (texts.length === 0) return [];
  if (mock) return texts.map((t) => `[${target}] ${t}`);
  const endpoint = apiKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const chunk = texts.slice(i, i + 50);
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chunk,
          source_lang: 'DE',
          target_lang: target,
          tag_handling: 'xml',
          ignore_tags: ['x'],
          formality: 'prefer_less',
          context,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        out.push(...data.translations.map((t) => t.text));
        break;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 4) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      const hint = res.status === 403 ? ' (Schlüssel ungültig?)' : res.status === 456 ? ' (Monatskontingent bei DeepL aufgebraucht)' : '';
      throw new Error(`DeepL antwortet mit ${res.status}${hint}: ${await res.text()}`);
    }
  }
  return out;
}

// Übersetzt einen Feldwert: Text, Liste von Texten oder Markdown (body).
async function translateValue(value, target, { markdown = false } = {}) {
  if (Array.isArray(value)) {
    const packed = value.map((v) => toXml(v ?? ''));
    const res = await deepl(packed.map((p) => p.xml), target);
    return res.map((r, i) => (value[i] ? fromXml(r, packed[i].originals) : ''));
  }
  if (!markdown) {
    const p = toXml(value);
    const [r] = await deepl([p.xml], target);
    return fromXml(r, p.originals);
  }
  const parts = splitMarkdown(value);
  const todo = parts.filter((p) => !('fixed' in p)).map((p) => ({ part: p, ...toXml(p.text) }));
  const res = await deepl(todo.map((t) => t.xml), target);
  todo.forEach((t, i) => (t.part.out = fromXml(res[i], t.originals)));
  return parts.map((p) => ('fixed' in p ? p.fixed : p.prefix + p.out)).join('\n');
}

// ---------- Ablauf ----------

const report = [];

for (const col of collections) {
  const deDir = join(contentDir, col.dir, 'de');
  if (!existsSync(deDir)) continue;
  const slugs = readdirSync(deDir).filter((f) => f.endsWith('.md'));

  for (const file of slugs) {
    const de = readEntry(join(deDir, file));
    const source = Object.fromEntries(Object.entries(col.fields).map(([k, get]) => [k, get(de.fm)]));
    source.body = de.body;

    for (const [lang, target] of Object.entries(targets)) {
      const path = join(contentDir, col.dir, lang, file);
      const exists = existsSync(path);
      const tr = exists ? readEntry(path) : { fm: {}, body: '' };
      const quelle = { ...(tr.fm.quelle ?? {}) };
      const current = { ...tr.fm, body: tr.body };
      delete current.quelle;
      const changed = [];

      for (const [field, value] of Object.entries(source)) {
        const fp = fingerprint(value);
        if (isEmpty(value)) {
          if (field in current && field !== 'body') delete current[field];
          if (field === 'body') current.body = '';
          if (quelle[field]) changed.push(field);
          delete quelle[field];
          continue;
        }
        const has = !isEmpty(current[field]);
        if (fingerprintsOnly) {
          if (has && quelle[field] !== fp) {
            quelle[field] = fp;
            changed.push(`${field} (gemerkt)`);
          }
          continue;
        }
        let needs = force || !has || (quelle[field] && quelle[field] !== fp);
        if (!needs && !quelle[field]) {
          // Ältere oder von Hand angelegte Übersetzung ohne Fingerabdruck: gilt als passend.
          quelle[field] = fp;
          changed.push(`${field} (gemerkt)`);
          continue;
        }
        if (!needs) continue;
        changed.push(field);
        if (!dryRun) {
          current[field] = await translateValue(value, target, { markdown: field === 'body' });
          quelle[field] = fp;
        }
      }

      if (!fingerprintsOnly) {
        for (const key of col.copy) {
          if (JSON.stringify(current[key]) !== JSON.stringify(de.fm[key])) {
            if (de.fm[key] === undefined) delete current[key];
            else current[key] = de.fm[key];
            if (exists) changed.push(key);
          }
        }
      }

      if (changed.length === 0) continue;
      report.push(`${col.dir}/${lang}/${file}: ${changed.join(', ')}`);
      if (dryRun) continue;
      const { body, ...fm } = current;
      // Reihenfolge: übersetzte Felder, kopierte Felder, Fingerabdrücke zuletzt
      writeEntry(path, { ...fm, quelle }, body);
    }
  }

  // Übersetzungen, deren deutscher Eintrag gelöscht wurde, ebenfalls entfernen
  for (const lang of Object.keys(targets)) {
    const dir = join(contentDir, col.dir, lang);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      if (slugs.includes(file)) continue;
      report.push(`${col.dir}/${lang}/${file}: entfernt (deutscher Eintrag gelöscht)`);
      if (!dryRun) rmSync(join(dir, file));
    }
  }
}

console.log(report.length ? report.join('\n') : 'Alle Übersetzungen sind aktuell.');
