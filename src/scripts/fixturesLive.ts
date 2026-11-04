// Frischt Spielplan und Tabelle im Browser auf, wenn /api/fixtures neuere Daten hat als der Build.
// Ohne JavaScript oder ohne API (lokal) bleibt einfach der Stand vom Build stehen.
import { gamesList, leagueTable, gameRow, seasonList, latestResults, resultRow, type FixturesLabels, type TeamFixtures, type Game, type Result } from '../lib/fixturesView';

// Ergebnisse stehen schon im Build. "Gespielt" hängt aber von der Uhrzeit ab, deshalb hier sofort
// mit der aktuellen Zeit neu zeichnen, auch ohne API (z. B. "Ergebnis folgt" am Sonntagabend).
const read = <T>(v: string | undefined, fallback: T) => (v ? (JSON.parse(v) as T) : fallback);
document.querySelectorAll<HTMLElement>('[data-results-latest]').forEach((el) => {
  const t = read<FixturesLabels>(el.dataset.labels, {} as FixturesLabels);
  const labels = read<Record<string, string>>(el.dataset.teamLabels, {});
  const last = latestResults(read<Record<string, Result[]>>(el.dataset.results, {}));
  if (last.length) el.innerHTML = `<ul>${last.map(({ slug, r }) => resultRow(r, t, labels[slug])).join('')}</ul>`;
});
document.querySelectorAll<HTMLElement>('[data-fixtures="season"]').forEach((el) => {
  const t = read<FixturesLabels>(el.dataset.labels, {} as FixturesLabels);
  el.innerHTML = seasonList(read<Game[] | null>(el.dataset.games, null), read<Result[]>(el.dataset.results, []), t);
});

type Payload = { fetchedAt: string; teams: Record<string, TeamFixtures> };

const nodes = document.querySelectorAll<HTMLElement>('[data-fixtures]');
if (nodes.length) {
  const query = nodes[0].dataset.query;
  const builtAt = nodes[0].dataset.builtAt ?? '';
  if (query) {
    fetch(`/api/fixtures?teams=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Payload>) : null))
      .then((data) => {
        if (!data || data.fetchedAt <= builtAt) return;
        nodes.forEach((el) => {
          const t = JSON.parse(el.dataset.labels ?? '{}') as FixturesLabels;
          const mode = el.dataset.fixtures;
          if (mode === 'next') {
            const labels = JSON.parse(el.dataset.teamLabels ?? '{}') as Record<string, string>;
            const next = Object.entries(data.teams)
              .map(([slug, f]) => (f.games?.[0] ? { slug, g: f.games[0] as Game } : null))
              .filter((x): x is { slug: string; g: Game } => !!x)
              .sort((a, b) => `${a.g.date}${a.g.time}`.localeCompare(`${b.g.date}${b.g.time}`));
            if (next.length) el.innerHTML = `<ul class="border-t border-line">${next.map(({ slug, g }) => gameRow(g, t, labels[slug])).join('')}</ul>`;
          } else {
            const team = data.teams[el.dataset.team ?? ''];
            if (!team) return;
            if (mode === 'games' && team.games) el.innerHTML = gamesList(team.games, t);
            // Ergebnisse stammen aus dem CMS und stehen schon im Build, nur der Spielplan wird frisch
            if (mode === 'season' && team.games) el.innerHTML = seasonList(team.games, read<Result[]>(el.dataset.results, []), t);
            if (mode === 'table' && team.table) el.innerHTML = leagueTable(team.table, t);
          }
        });
      })
      .catch(() => {});
  }
}
