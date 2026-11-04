// Legt anstehende Spiele als Ergebnis-Einträge ohne Tore im CMS an (src/content/ergebnisse).
// Die Redaktion muss nach dem Spiel nur noch die Tore eintragen.
// Läuft täglich über .github/workflows/sync-results.yml.
//
// Gelesen wird nur der Spielplan von fussball.de (Klartext, dieselbe Quelle wie auf der Seite).
// Tore liest dieses Skript nie: Die sind auf fussball.de gegen Auslesen geschützt.
//
// Sicherheitsregeln, damit nie etwas von der Redaktion überschrieben wird:
// 1. Ein Eintrag mit Toren oder Besonderheit wird nie mehr angefasst.
// 2. An offenen Einträgen ändert das Skript nur Datum und Anstoß (Spielverlegung) und ergänzt
//    einen fehlenden Link zum Spiel auf fussball.de.
//    Gegner, Heim/Auswärts und Wettbewerb bleiben, wie sie beim Anlegen waren oder wie die
//    Redaktion sie korrigiert hat.
// 3. Das Skript löscht nie etwas.
// 4. Gibt es für Mannschaft und Tag schon einen Eintrag ohne fussball.de-Kennung (von Hand
//    angelegt), bekommt er nur die Kennung, statt doppelt angelegt zu werden.
// 5. Antwortet fussball.de nicht oder wären es ungewöhnlich viele Änderungen, bricht das Skript
//    ab, ohne etwas zu schreiben. Der Workflow schlägt dann fehl und GitHub meldet es per E-Mail.
//
// Aufruf: node scripts/sync-results.mjs [--dry-run]
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { fetchNextGames } from '../src/lib/fussballde.mjs';

const TEAMS_DIR = 'src/content/teams/de';
const DIR = 'src/content/ergebnisse';
// Angelegt wird ein Spiel erst kurz vorher, damit Verlegungen meist schon feststehen
const DAYS_AHEAD = 3;
const MAX_CHANGES = 12;

const front = (file) => {
  const m = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parse(m[1]) ?? {} : {};
};

/** Kennung des Spiels aus der fussball.de-Adresse (letzter Pfadteil nach /spiel/). */
export function matchId(url) {
  return url?.match(/\/spiel\/([0-9A-Z]{20,40})(?:[/?#]|$)/)?.[1] ?? null;
}

const dateOf = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''));
const settled = (e) => e.goalsFor != null || e.goalsAgainst != null || !!e.note;

/**
 * Was zu tun ist, ohne etwas zu schreiben. Exportiert für Tests.
 * existing: [{ file, data }], games: [{ team, league, game }], today: 'YYYY-MM-DD'
 */
export function plan(existing, games, today) {
  const limit = new Date(`${today}T12:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + DAYS_AHEAD);
  const until = limit.toISOString().slice(0, 10);
  const byId = new Map(existing.filter((e) => e.data.fussballDeId).map((e) => [e.data.fussballDeId, e]));
  const taken = new Set(existing.map((e) => e.file));
  const changes = [];

  for (const { team, league = '', game } of games) {
    const id = matchId(game.url);
    if (!id) continue;
    const known = byId.get(id);
    if (known) {
      if (settled(known.data)) continue; // Regel 1
      const date = dateOf(known.data.date);
      if (date !== game.date || String(known.data.time ?? '') !== game.time) {
        // Regel 2: nur Datum und Anstoß (und der Link, falls er noch fehlt)
        changes.push({ kind: 'move', file: known.file, data: { ...known.data, date: game.date, time: game.time, fussballDeUrl: known.data.fussballDeUrl || game.url }, label: `${team} ${game.opponent}: ${date} → ${game.date} ${game.time}` });
      } else if (!known.data.fussballDeUrl) {
        changes.push({ kind: 'link', file: known.file, data: { ...known.data, fussballDeUrl: game.url }, label: `${team} ${game.opponent}: Link zu fussball.de ergänzt` });
      }
      continue;
    }
    if (game.date > until) continue;
    // Regel 4: von Hand angelegter Eintrag für denselben Tag
    const manual = existing.find((e) => !e.data.fussballDeId && e.data.team === team && dateOf(e.data.date) === game.date);
    if (manual) {
      changes.push({ kind: 'link', file: manual.file, data: { ...manual.data, fussballDeId: id, fussballDeUrl: manual.data.fussballDeUrl || game.url }, label: `${team} ${game.opponent}: mit fussball.de verknüpft` });
      byId.set(id, manual);
      continue;
    }
    let file = `${game.date}-${team}.md`;
    for (let n = 2; taken.has(file); n++) file = `${game.date}-${team}-${n}.md`;
    taken.add(file);
    changes.push({
      kind: 'new',
      file,
      data: {
        team,
        date: game.date,
        time: game.time,
        opponent: game.opponent,
        isHome: game.isHome,
        // Ligaspiele ohne Wettbewerb speichern: Dann zeigt die Seite die übersetzte Liga der Mannschaft
        ...(game.competition && !league.includes(game.competition) ? { competition: game.competition } : {}),
        fussballDeId: id,
        fussballDeUrl: game.url,
      },
      label: `${team} ${game.date} ${game.isHome ? 'gegen' : 'bei'} ${game.opponent}`,
    });
  }
  return changes;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

  const teams = readdirSync(TEAMS_DIR)
    .filter((n) => n.endsWith('.md'))
    .map((f) => {
      const data = front(`${TEAMS_DIR}/${f}`);
      return { slug: f.replace(/\.md$/, ''), id: String(data.fussballDeTeamId ?? ''), league: String(data.league ?? '') };
    })
    .filter((t) => /^[0-9A-Z]{32}$/.test(t.id));

  // Regel 5: Fehler bei fussball.de brechen alles ab (fetchNextGames wirft dann)
  const games = [];
  for (const t of teams) for (const game of await fetchNextGames(t.id, 10)) games.push({ team: t.slug, league: t.league, game });

  // Bericht: was im Spielplan steht, auch wenn noch nichts anzulegen ist. So zeigt schon der
  // Probelauf, dass fussball.de gelesen wurde.
  console.log(`Spielplan gelesen (${teams.length} Mannschaften, ${games.length} Spiele):`);
  for (const { team, game } of games) {
    console.log(`  ${team} ${game.date} ${game.time} ${game.isHome ? 'gegen' : 'bei'} ${game.opponent}${matchId(game.url) ? '' : ' (ohne Kennung, wird übersprungen)'}`);
  }
  if (teams.length > 0 && games.length === 0) console.log('  (keine anstehenden Spiele)');
  console.log(`Angelegt werden Spiele bis ${DAYS_AHEAD} Tage im Voraus.`);
  console.log('');

  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const existing = readdirSync(DIR)
    .filter((n) => n.endsWith('.md'))
    .map((file) => ({ file, data: front(`${DIR}/${file}`) }));

  const changes = plan(existing, games, today);
  if (changes.length > MAX_CHANGES) {
    console.error(`Abbruch: ${changes.length} Änderungen auf einmal, erlaubt sind ${MAX_CHANGES}. Bitte prüfen.`);
    changes.forEach((c) => console.error(`  ${c.kind}: ${c.label}`));
    process.exit(1);
  }
  for (const c of changes) {
    console.log(`${{ new: 'Neu', move: 'Verlegt', link: 'Verknüpft' }[c.kind]}: ${c.label}`);
    if (dryRun) continue;
    // Body des Eintrags (falls vorhanden) bleibt erhalten
    const path = `${DIR}/${c.file}`;
    const body = existsSync(path) ? readFileSync(path, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : '';
    writeFileSync(path, `---\n${stringify(c.data)}---\n${body}`);
  }
  if (changes.length === 0) console.log('Nichts zu tun.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`Abbruch: ${err.message}`);
    process.exit(1);
  });
}
