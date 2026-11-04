import opentype from 'opentype.js';

// Spielplan und Tabelle direkt von fussball.de, ohne Widget und ohne Fremd-Script im Browser.
//
// Wird zweimal genutzt:
// 1. Beim Build (Astro), damit die Seite sofort mit Daten ausgeliefert wird.
// 2. Von der Vercel-Funktion /api/fixtures, die der Browser stündlich gecacht abfragt.
//    So bleiben Ansetzungen und Tabelle aktuell, auch wenn niemand neu deployt.
//
// Die Team-ID steht auf fussball.de in der URL der Mannschaft ("team-id/...") und wird im
// CMS pro Mannschaft gepflegt. Sie bleibt über Spielzeiten hinweg gleich.
//
// Ergebnisse vergangener Spiele verschleiert fussball.de: Die Tore stehen als Zeichen aus dem
// privaten Unicode-Bereich im HTML, erst eine Schrift pro Abfrage macht daraus Ziffern. Wir laden
// diese Schrift serverseitig und lesen ab, welche Ziffer hinter welchem Zeichen steckt
// (decodeScore). Klappt das nicht, gibt es lieber kein Ergebnis als ein falsches.

const BASE = 'https://www.fussball.de';
const UA = 'Mozilla/5.0 (compatible; FCTreptowSite/1.0; +https://www.fc-treptow.de)';
const TIMEOUT_MS = 8000;


async function get(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`fussball.de ${res.status} for ${url}`);
  return { html: await res.text(), url: res.url };
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

const text = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const isValidId = (id) => typeof id === 'string' && /^[0-9A-Z]{32}$/.test(id);

export function teamPageUrl(teamId) {
  return `${BASE}/mannschaft/-/team-id/${teamId}`;
}

/** Zerlegt die Spielliste von fussball.de (nächste oder letzte Spiele) in Zeilen. */
function parseGameRows(html, teamId) {
  // Keine Tabelle im HTML heißt: Wartungsseite, Bot-Sperre oder geändertes Layout. Lieber
  // ehrlich scheitern als leere Daten als "keine Spiele" ausliefern.
  if (!html.includes('<tbody')) throw new Error('fussball.de: no fixtures table in response');
  const tbody = html.slice(html.indexOf('<tbody'), html.lastIndexOf('</tbody>'));
  const rows = tbody.split(/<tr class="row-headline visible-small">/).slice(1);
  const games = [];
  for (const row of rows) {
    const head = text(row.slice(0, row.indexOf('</tr>')));
    // "Sonntag, 27.09.2026 - 16:15 Uhr | Kreisliga B"
    const m = head.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2}):(\d{2})\s*Uhr\s*\|\s*(.*)$/);
    if (!m) continue;
    const [, dd, mm, yyyy, hh, min, competition] = m;
    const clubs = [...row.matchAll(/<td class="column-club[^"]*">\s*<a href="([^"]+)"[\s\S]*?<div class="club-name">([\s\S]*?)<\/div>/g)];
    if (clubs.length < 2) continue;
    const [home, away] = clubs.map(([, href, name]) => ({ name: text(name), isUs: href.includes(teamId) }));
    const matchUrl = row.match(/href="(https:\/\/www\.fussball\.de\/spiel\/[^"]+)"/)?.[1] ?? null;
    games.push({
      game: {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        competition: competition.trim(),
        home: home.name,
        away: away.name,
        isHome: home.isUs,
        opponent: home.isUs ? away.name : home.name,
        url: matchUrl,
      },
      row,
    });
  }
  return games;
}

/** Nächste Spiele einer Mannschaft. */
export async function fetchNextGames(teamId, limit = 5) {
  if (!isValidId(teamId)) return [];
  const { html } = await get(`${BASE}/ajax.team.next.games/-/mode/PAGE/team-id/${teamId}`);
  const provisional = /vorläufige Spiele/.test(html);
  return parseGameRows(html, teamId)
    .slice(0, limit)
    .map(({ game }) => ({ ...game, provisional }));
}

// --- Ergebnisse ----------------------------------------------------------------------------

const GLYPH_NAMES = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  colon: ':', hyphen: '-', minus: '-', space: ' ',
};

/** Zeichen-zu-Klartext-Tabelle aus einer Schrift (ArrayBuffer). Exportiert für Tests. */
export function glyphMap(buffer) {
  const font = opentype.parse(buffer);
  const map = new Map();
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    const codes = glyph.unicodes ?? [];
    // 1. Glyphe trägt neben dem Ersatzzeichen auch die echte Ziffer
    const plain = codes.map((c) => String.fromCodePoint(c)).find((c) => /[0-9:\-]/.test(c));
    // 2. Name der Glyphe ("one", "uni0031", "1")
    const name = glyph.name ?? '';
    const byName =
      GLYPH_NAMES[name] ??
      (/^uni00(3[0-9]|3A|2D)$/i.test(name) ? String.fromCharCode(parseInt(name.slice(3), 16)) : undefined) ??
      (/^[0-9]$/.test(name) ? name : undefined);
    const value = plain ?? byName;
    if (value === undefined) continue;
    for (const c of codes) if (c >= 0xe000) map.set(String.fromCodePoint(c), value);
  }
  return map;
}

const fontCache = new Map();

async function fontFor(id) {
  if (!/^[0-9a-z]+$/i.test(id)) throw new Error('fussball.de: bad obfuscation id');
  if (!fontCache.has(id)) {
    const load = (async () => {
      for (const format of ['ttf', 'woff']) {
        const res = await fetch(`${BASE}/export.fontface/-/format/${format}/id/${id}/type/font`, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) continue;
        const map = glyphMap(await res.arrayBuffer());
        if (map.size >= 10) return map;
      }
      throw new Error(`fussball.de: font ${id} not decodable`);
    })();
    fontCache.set(id, load);
    load.catch(() => fontCache.delete(id));
  }
  return fontCache.get(id);
}

/**
 * Ergebnis aus der Ergebnisspalte einer Zeile. Liefert Tore (Heim, Gast), einen Hinweis wie
 * "Abgesetzt"/"Nichtantritt", oder null, wenn nichts Lesbares drinsteht.
 * Exportiert für Tests; `fonts` lässt sich dort durch eine feste Tabelle ersetzen.
 */
export async function decodeScore(row, fonts = fontFor) {
  const cell = row.match(/<td class="column-score[^"]*">([\s\S]*?)<\/td>/)?.[1];
  if (!cell) return null;
  const left = cell.match(/<span data-obfuscation="([^"]+)" class="score-left">([\s\S]*?)<\/span>/);
  const right = cell.match(/<span data-obfuscation="([^"]+)" class="score-right">([\s\S]*?)<\/span>/);
  const note = text(cell.match(/<span class="info-text">([\s\S]*?)<\/span>/)?.[1] ?? '') || null;
  if (!left || !right) {
    // Kein verschleiertes Ergebnis: entweder Klartext ("3:1") oder ein Hinweis ("Absetzung")
    const plain = text(cell).match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
    if (plain) return { goalsHome: Number(plain[1]), goalsAway: Number(plain[2]), note };
    const t = text(cell);
    return t && !/^[-:\s]*$/.test(t) ? { goalsHome: null, goalsAway: null, note: note ?? t } : null;
  }
  const read = async ([, id, inner]) => {
    const map = await fonts(id);
    const chars = [...decode(inner.replace(/<[^>]+>/g, '')).trim()];
    const out = chars.map((c) => (/[0-9]/.test(c) ? c : map.get(c))).join('');
    return /^\d{1,2}$/.test(out) ? Number(out) : null;
  };
  const [goalsHome, goalsAway] = await Promise.all([read(left), read(right)]);
  if (goalsHome === null || goalsAway === null) {
    // Lieber ohne Ergebnis als mit einem geratenen
    return note ? { goalsHome: null, goalsAway: null, note } : null;
  }
  return { goalsHome, goalsAway, note };
}

/** Letzte Spiele einer Mannschaft mit Ergebnis, neuestes zuerst. */
export async function fetchPrevGames(teamId, limit = 5) {
  if (!isValidId(teamId)) return [];
  const { html } = await get(`${BASE}/ajax.team.prev.games/-/mode/PAGE/team-id/${teamId}`);
  const rows = parseGameRows(html, teamId)
    .sort((a, b) => `${b.game.date}${b.game.time}`.localeCompare(`${a.game.date}${a.game.time}`))
    .slice(0, limit);
  const results = await Promise.all(
    rows.map(async ({ game, row }) => {
      const score = await decodeScore(row).catch(() => null);
      if (!score) return null;
      return { ...game, ...score };
    }),
  );
  return results.filter(Boolean);
}

/** Aktuelle Tabelle der Staffel, in der die Mannschaft spielt. */
export async function fetchTable(teamId) {
  if (!isValidId(teamId)) return null;
  const page = await get(teamPageUrl(teamId));
  const tablePath = page.html.match(/ajax\.team\.table\/-\/saison\/[^'"]+/)?.[0];
  if (!tablePath) return null;
  const { html } = await get(`${BASE}/${tablePath}`);
  if (!html.includes('<tbody')) throw new Error('fussball.de: no league table in response');
  const tbody = html.slice(html.indexOf('<tbody'), html.indexOf('</tbody>'));
  const rows = [];
  for (const [, cls, body] of tbody.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)) {
    const cells = [...body.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)].map(([, attrs, inner]) => ({ attrs, inner }));
    if (cells.length < 10) continue;
    const href = cells[2].inner.match(/href="([^"]+)"/)?.[1] ?? '';
    const [gf, ga] = text(cells[7].inner).split(':').map((n) => Number(n.trim()));
    rows.push({
      rank: Number(text(cells[1].inner).replace('.', '')) || rows.length + 1,
      club: text(cells[2].inner.match(/<div class="club-name">([\s\S]*?)<\/div>/)?.[1] ?? ''),
      played: Number(text(cells[3].inner)),
      won: Number(text(cells[4].inner)),
      drawn: Number(text(cells[5].inner)),
      lost: Number(text(cells[6].inner)),
      goalsFor: gf,
      goalsAgainst: ga,
      diff: Number(text(cells[8].inner)),
      points: Number(text(cells[9].inner)),
      isUs: href.includes(teamId),
      zone: /row-promotion/.test(cls) ? 'up' : /row-relegation/.test(cls) ? 'down' : null,
    });
  }
  const season = page.url.match(/saison\/(\d{2})(\d{2})/);
  return {
    rows,
    season: season ? `20${season[1]}/${season[2]}` : null,
    url: page.url,
  };
}

/** Alles für eine Liste von Mannschaften. Fehler einzelner Teams brechen nichts. */
export async function fetchAll(teams) {
  const entries = await Promise.all(
    teams.map(async ({ slug, teamId }) => {
      const [games, results, table] = await Promise.all([
        fetchNextGames(teamId).catch(() => null),
        fetchPrevGames(teamId).catch(() => null),
        fetchTable(teamId).catch(() => null),
      ]);
      return [slug, { games, results, table, url: isValidId(teamId) ? teamPageUrl(teamId) : null }];
    }),
  );
  return { fetchedAt: new Date().toISOString(), teams: Object.fromEntries(entries) };
}
