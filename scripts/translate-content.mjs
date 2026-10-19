#!/usr/bin/env node
// Übersetzt die deutschen Inhalte (Mannschaften und News) mit der Gemini API von Google in alle
// anderen Sprachen der Seite. Die kostenlose Stufe braucht nur einen API-Schlüssel aus Google AI
// Studio (aistudio.google.com), keine Zahlungsdaten. Er liegt in GitHub als Secret GEMINI_API_KEY.
//
// Läuft automatisch in GitHub Actions (.github/workflows/translate.yml), sobald im CMS eine
// deutsche Mannschaft oder Neuigkeit gespeichert wird. Lokal:
//
//   GEMINI_API_KEY=… node scripts/translate-content.mjs           # nur Geändertes übersetzen
//   GEMINI_API_KEY=… node scripts/translate-content.mjs --force   # alles neu übersetzen
//   node scripts/translate-content.mjs --fingerprints-only            # nichts übersetzen, nur den
//                                                                     # aktuellen Stand als "passt" merken
//   node scripts/translate-content.mjs --dry-run                      # nur anzeigen, was passieren würde
//
// Wie entschieden wird, was neu übersetzt wird:
// Jede Übersetzungsdatei merkt sich unter "quelle" pro Feld einen Fingerabdruck des deutschen
// Textes, aus dem sie entstanden ist. Ein Feld wird nur neu übersetzt, wenn sich der deutsche
// Text seitdem geändert hat. Wer eine Übersetzung von Hand verbessert, verliert die Verbesserung
// also erst, wenn sich das deutsche Original dieses Feldes ändert.
//
// Modell: über die Repository-Variable TRANSLATE_MODEL wählbar (GitHub → Settings → Secrets and
// variables → Actions → Variables). Ohne Angabe werden die Modelle in "defaultModels" der Reihe
// nach versucht, bis eines verfügbar ist.
// Kostenlos gelten Limits (Stand Oktober 2026 etwa 10 Anfragen pro Minute und gut 1.000 am Tag
// für die Flash-Modelle). Ein Aufruf übersetzt einen Eintrag in eine Sprache, ein gespeicherter
// Eintrag braucht also fünf Anfragen.
//
// An Google gehen nur die öffentlichen Texte der Seite, keine Daten von Besucherinnen und
// Besuchern. In der kostenlosen Stufe darf Google diese Texte zur Verbesserung seiner Dienste nutzen.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content');

const languages = {
  en: 'British English',
  tr: 'Turkish',
  ar: 'Modern Standard Arabic',
  es: 'Spanish',
  fr: 'French',
};

const defaultModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash'];

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

// Feste Übersetzungen, damit die Seite einheitlich bleibt (wie in src/i18n/ verwendet)
const glossary = {
  en: { 'Herren I': "Men's I", 'Herren II': "Men's II", 'Herren III': "Men's III", Freizeit: 'Recreational' },
  tr: { 'Herren I': 'Erkekler I', 'Herren II': 'Erkekler II', 'Herren III': 'Erkekler III' },
  ar: { 'Herren I': 'الرجال الأول', 'Herren II': 'الرجال الثاني', 'Herren III': 'الرجال الثالث' },
  es: { 'Herren I': 'Masculino I', 'Herren II': 'Masculino II', 'Herren III': 'Masculino III' },
  fr: { 'Herren I': 'Hommes I', 'Herren II': 'Hommes II', 'Herren III': 'Hommes III' },
};

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');
const fingerprintsOnly = args.has('--fingerprints-only');
const mock = process.env.TRANSLATE_MOCK === '1'; // nur für Tests: "[en] Text" statt Gemini
const apiKey = process.env.GEMINI_API_KEY?.trim();
// Nur für Tests gegen einen lokalen Server änderbar
const baseUrl = process.env.TRANSLATE_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
const models = process.env.TRANSLATE_MODEL?.trim() ? [process.env.TRANSLATE_MODEL.trim()] : defaultModels;

if (!apiKey && !mock && !fingerprintsOnly && !dryRun) {
  console.log('::warning::GEMINI_API_KEY fehlt. Es wird nichts übersetzt. Den Schlüssel aus Google AI Studio in GitHub unter Settings → Secrets and variables → Actions als GEMINI_API_KEY hinterlegen.');
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

// ---------- Gemini API ----------

function prompt(lang) {
  const terms = Object.entries(glossary[lang] ?? {}).map(([de, tr]) => `"${de}" → "${tr}"`).join(', ');
  return [
    `You translate website texts of FC Treptow, an amateur football club in Berlin, from German into ${languages[lang]}.`,
    'You receive a JSON object. Return a JSON object with exactly the same keys and the same structure (arrays keep their length and order), with every value translated. Return only the JSON, no explanations, no code fences.',
    'Rules:',
    '- Natural, friendly, informal tone, as a neighbourhood club talks to its members and new players. Where the language distinguishes, use the informal form of address.',
    '- Keep Markdown exactly: headings, lists, bold, italics, line breaks, links. Translate link labels, never change URLs, e-mail addresses, phone numbers or image paths.',
    '- Keep proper names unchanged: people, the club name "FC Treptow", team names such as "River Plate" or "Freizeit Kickers", league names such as "Kreisliga B", the ground "Willi-Sänger-Sportanlage", streets and places.',
    '- Keep dates, times and numbers correct; you may adapt their format to the target language.',
    '- Do not add, drop or summarise content.',
    terms ? `- Fixed terms: ${terms}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let workingModel = null;

// Kostenlos sind nur wenige Anfragen pro Minute erlaubt, deshalb kurz Abstand halten
let lastCall = 0;
const gap = mock || process.env.TRANSLATE_BASE_URL ? 0 : 7000;

async function chat(model, lang, input) {
  for (let attempt = 0; ; attempt++) {
    await sleep(Math.max(0, lastCall + gap - Date.now()));
    lastCall = Date.now();
    const res = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt(lang) }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(input, null, 2) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });
    if (res.ok) {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unerwartete Antwort der Gemini API (${model}): ${text.slice(0, 300)}`);
      }
      // Gedanken-Teile (bei Modellen mit "Thinking") nicht mitnehmen
      return (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = Number(res.headers.get('retry-after'));
      // Längere Wartezeiten (Tageslimit erreicht) nicht absitzen, sondern abbrechen
      if (Number.isFinite(wait) && wait > 120) break;
      await sleep(Number.isFinite(wait) && wait > 0 ? wait * 1000 : 5000 * 2 ** attempt);
      continue;
    }
    const err = new Error(`Gemini API antwortet mit ${res.status} (${model}): ${(await res.text()).replace(/\s+/g, ' ').slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  const err = new Error(`Tageslimit der Gemini API erreicht (${model}). Der nächste Lauf holt das Fehlende nach (Actions → Übersetzen → Run workflow).`);
  err.status = 429;
  throw err;
}

// Alle Adressen, die in der Übersetzung unverändert wieder vorkommen müssen
const keepers = (s) => (s.match(/(?:https?:\/\/|mailto:|www\.)[^\s)>\]"]+|[\w.+-]+@[\w-]+\.[\w.-]+|\/images\/[^\s)"]+/g) ?? []);

function check(input, out) {
  if (!out || typeof out !== 'object') return 'keine JSON-Antwort';
  for (const [key, value] of Object.entries(input)) {
    const got = out[key];
    if (Array.isArray(value)) {
      if (!Array.isArray(got) || got.length !== value.length) return `${key}: Liste hat nicht die gleiche Länge`;
      if (got.some((g, i) => value[i] && (typeof g !== 'string' || !g.trim()))) return `${key}: leerer Eintrag`;
    } else if (typeof got !== 'string' || !got.trim()) return `${key}: fehlt`;
    const text = Array.isArray(got) ? got.join('\n') : got;
    for (const k of keepers(Array.isArray(value) ? value.join('\n') : value)) {
      if (!text.includes(k)) return `${key}: "${k}" fehlt in der Übersetzung`;
    }
  }
  return null;
}

function parseJson(text) {
  const s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    try {
      return m ? JSON.parse(m[0]) : null;
    } catch {
      return null;
    }
  }
}

// Übersetzt alle Felder eines Eintrags für eine Sprache in einem Aufruf.
async function translate(input, lang) {
  if (mock) {
    const tag = (s) => (s ? `[${lang}] ${s}` : s);
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, Array.isArray(v) ? v.map(tag) : tag(v)]));
  }
  const candidates = workingModel ? [workingModel] : models;
  let lastError;
  const tried = [];
  for (const model of candidates) {
    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const out = parseJson(await chat(model, lang, input));
        const problem = check(input, out);
        if (!problem) {
          workingModel = model;
          return out;
        }
        lastError = new Error(`Übersetzung unbrauchbar (${model}, ${lang}): ${problem}`);
      }
    } catch (e) {
      lastError = e;
      tried.push(`${model}: ${e.status ?? ''}`);
      // Modell nicht vorhanden oder nicht im kostenlosen Kontingent: nächstes versuchen
      if (!workingModel && [400, 402, 403, 404].includes(e.status)) continue;
      throw e;
    }
    if (workingModel) break;
  }
  if (tried.length > 1) lastError.message += ` (versucht: ${tried.join(', ')})`;
  if (lastError?.status === 401) lastError.message += ' (Schlüssel ungültig?)';
  if (lastError?.status === 403) lastError.message += ' (Schlüssel ungültig oder Gemini API für das Google-Projekt nicht freigeschaltet?)';
  throw lastError;
}

// ---------- Ablauf ----------

async function main() {
  const report = [];
  let limitReached = false;

  outer: for (const col of collections) {
    const deDir = join(contentDir, col.dir, 'de');
    if (!existsSync(deDir)) continue;
    const slugs = readdirSync(deDir).filter((f) => f.endsWith('.md'));

    for (const file of slugs) {
      const de = readEntry(join(deDir, file));
      const source = Object.fromEntries(Object.entries(col.fields).map(([k, get]) => [k, get(de.fm)]));
      source.body = de.body;

      for (const lang of Object.keys(languages)) {
        const path = join(contentDir, col.dir, lang, file);
        const exists = existsSync(path);
        const tr = exists ? readEntry(path) : { fm: {}, body: '' };
        const quelle = { ...(tr.fm.quelle ?? {}) };
        const current = { ...tr.fm, body: tr.body };
        delete current.quelle;
        const changed = [];
        const todo = {};

        for (const [field, value] of Object.entries(source)) {
          const fp = fingerprint(value);
          if (isEmpty(value)) {
            if (field === 'body') current.body = '';
            else delete current[field];
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
          const needs = force || !has || (quelle[field] && quelle[field] !== fp);
          if (!needs && !quelle[field]) {
            // Ältere oder von Hand angelegte Übersetzung ohne Fingerabdruck: gilt als passend.
            quelle[field] = fp;
            changed.push(`${field} (gemerkt)`);
            continue;
          }
          if (!needs) continue;
          changed.push(field);
          todo[field] = value;
        }

        if (Object.keys(todo).length && !dryRun) {
          let out;
          try {
            out = await translate(todo, lang);
          } catch (e) {
            // Limit erreicht: bisher Übersetztes behalten, den Rest beim nächsten Lauf nachholen
            if (e.status !== 429) throw e;
            console.log(`::warning::${e.message}`);
            limitReached = true;
            break outer;
          }
          for (const field of Object.keys(todo)) {
            current[field] = Array.isArray(todo[field]) ? out[field].map((s) => s.trim()) : out[field].trim();
            quelle[field] = fingerprint(source[field]);
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
    for (const lang of Object.keys(languages)) {
      const dir = join(contentDir, col.dir, lang);
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
        if (slugs.includes(file)) continue;
        report.push(`${col.dir}/${lang}/${file}: entfernt (deutscher Eintrag gelöscht)`);
        if (!dryRun) rmSync(join(dir, file));
      }
    }
  }

  if (workingModel) console.log(`Modell: ${workingModel}`);
  console.log(report.length ? report.join('\n') : 'Alle Übersetzungen sind aktuell.');
}

// Fehler als Hinweis in GitHub Actions anzeigen, damit man ihn ohne Log-Suche sieht
main().catch((e) => {
  console.log(`::error::Übersetzung fehlgeschlagen: ${e.message}`);
  process.exit(1);
});
