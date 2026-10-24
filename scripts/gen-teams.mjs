// Schreibt Angaben aus src/content/teams/de nach api/_teams.mjs, damit die Vercel-Funktionen
// sie ohne Astro lesen können. Läuft automatisch vor dev und build.
//
// - allowedTeams: fussball.de-Team-IDs, damit api/fixtures.mjs nur die eigenen Mannschaften abfragt.
// - formTeams: Name, Kontakt-E-Mail und Trainingszeiten für das Probetraining-Formular
//   (api/probetraining.mjs). Die Kontakt-E-Mail pflegt die Redaktion im CMS.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/teams/de';
const allowedTeams = {};
const formTeams = {};
const entries = [];

for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  const front = readFileSync(`${dir}/${f}`, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = front ? parse(front[1]) ?? {} : {};
  const teamId = String(data.fussballDeTeamId ?? '');
  if (/^[0-9A-Z]{32}$/.test(teamId)) allowedTeams[slug] = teamId;
  entries.push({ slug, data });
}

entries.sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
for (const { slug, data } of entries) {
  const contact = String(data.contact ?? '').trim();
  formTeams[slug] = {
    name: String(data.name ?? slug),
    contact: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact.toLowerCase() : '',
    training: (data.training ?? []).map((t) => ({ day: t.day, from: String(t.from), to: String(t.to) })),
  };
}

writeFileSync(
  'api/_teams.mjs',
  `// Automatisch erzeugt von scripts/gen-teams.mjs, nicht von Hand ändern.\n` +
    `export const allowedTeams = ${JSON.stringify(allowedTeams, null, 2)};\n\n` +
    `export const formTeams = ${JSON.stringify(formTeams, null, 2)};\n`,
);
