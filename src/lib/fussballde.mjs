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
// Ergebnisse vergangener Spiele liest dieses Modul bewusst nicht: fussball.de verschleiert
// Tore mit einer Spezialschrift. Die Tabelle dagegen ist Klartext.

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

/** Nächste Spiele einer Mannschaft. */
export async function fetchNextGames(teamId, limit = 5) {
  if (!isValidId(teamId)) return [];
  const { html } = await get(`${BASE}/ajax.team.next.games/-/mode/PAGE/team-id/${teamId}`);
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
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      competition: competition.trim(),
      home: home.name,
      away: away.name,
      isHome: home.isUs,
      opponent: home.isUs ? away.name : home.name,
      url: matchUrl,
    });
    if (games.length >= limit) break;
  }
  const provisional = /vorläufige Spiele/.test(html);
  return games.map((g) => ({ ...g, provisional }));
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
      const [games, table] = await Promise.all([
        fetchNextGames(teamId).catch(() => null),
        fetchTable(teamId).catch(() => null),
      ]);
      return [slug, { games, table, url: isValidId(teamId) ? teamPageUrl(teamId) : null }];
    }),
  );
  return { fetchedAt: new Date().toISOString(), teams: Object.fromEntries(entries) };
}
