// HTML für Spielplan und Tabelle. Läuft beim Build (Astro, set:html) und im Browser, wenn
// /api/fixtures frischere Daten liefert. Eine Vorlage für beide Wege, damit nichts auseinanderläuft.

export interface Game {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  competition: string;
  home: string;
  away: string;
  isHome: boolean;
  opponent: string;
  url: string | null;
  provisional?: boolean;
}

// Ergebnis aus dem CMS (src/lib/results.ts). Tore aus unserer Sicht.
export interface Result {
  date: string; // YYYY-MM-DD
  opponent: string;
  isHome: boolean;
  goalsFor: number | null; // null nur bei abgesetzten Spielen
  goalsAgainst: number | null;
  competition: string;
  note: 'cancelled' | 'forfeitOpponent' | 'forfeitUs' | null;
}

export interface TableRow {
  rank: number;
  club: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  diff: number;
  points: number;
  isUs: boolean;
  zone: 'up' | 'down' | null;
}

export interface TeamFixtures {
  games: Game[] | null;
  table: { rows: TableRow[]; season: string | null; url: string } | null;
  url: string | null;
}

export interface FixturesLabels {
  locale: string; // BCP 47
  home: string; // "Heim"
  away: string; // "Auswärts"
  vs: string;
  provisional: string;
  noGames: string;
  noResults: string;
  today: string;
  notes: { cancelled: string; forfeitOpponent: string; forfeitUs: string };
  win: string;
  draw: string;
  loss: string;
  table: { rank: string; club: string; played: string; goals: string; diff: string; points: string; caption: string };
  unavailable: string;
  source: string;
  matchLink: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function when(g: { date: string }, locale: string) {
  // Mittags UTC, damit die Zeitzone des Servers das Datum nicht verschiebt
  const d = new Date(`${g.date}T12:00:00Z`);
  // Lateinische Ziffern auch im Arabischen, damit Datum und Uhrzeit zusammenpassen
  const weekday = d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC', numberingSystem: 'latn' }).replace('.', '');
  const day = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC', numberingSystem: 'latn' });
  return { weekday, day };
}

/** Kompakte Zeile: ein Spiel, optional mit Mannschaftsname davor (Startseite). */
export function gameRow(g: Game, t: FixturesLabels, teamLabel?: string) {
  const { weekday, day } = when(g, t.locale);
  const tag = g.isHome ? t.home : t.away;
  const Tag = g.url ? 'a' : 'div';
  const href = g.url ? ` href="${esc(g.url)}" rel="noopener" target="_blank" aria-label="${esc(`${g.home} ${t.vs} ${g.away}, ${day} ${g.time}. ${t.matchLink}`)}"` : '';
  return `<li><${Tag}${href} class="group grid grid-cols-[4.25rem_1fr_auto] items-center gap-x-4 border-b border-line py-4 transition-colors duration-200 hover:bg-paper-deep/60 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-x-6 sm:px-2">
  <span class="nums leading-tight"><span class="block text-xs font-semibold uppercase tracking-wider text-ink-soft">${esc(weekday)}</span><span class="display block text-2xl sm:text-3xl">${esc(day)}</span></span>
  <span class="min-w-0">
    ${teamLabel ? `<span class="block text-xs font-semibold uppercase tracking-wider text-club">${esc(teamLabel)}</span>` : ''}
    <span class="mt-0.5 block truncate text-[15px] font-semibold sm:text-base">${g.isHome ? '' : `<span class="font-normal text-ink-soft">${esc(t.vs)} </span>`}${esc(g.opponent)}</span>
    <span class="mt-0.5 block text-xs text-ink-soft">${esc(g.competition)}</span>
  </span>
  <span class="text-end">
    <span class="nums display block text-2xl sm:text-3xl">${esc(g.time)}</span>
    <span class="mt-0.5 inline-block text-[11px] font-semibold uppercase tracking-wider ${g.isHome ? 'text-ink' : 'text-ink-soft'}">${esc(tag)}</span>
  </span>
</${Tag}></li>`;
}

/** Kompakte Zeile: ein Ergebnis, unsere Tore zuerst, darunter Ausgang oder Hinweis. */
export function resultRow(r: Result, t: FixturesLabels, teamLabel?: string) {
  const { weekday, day } = when(r, t.locale);
  const scored = r.goalsFor !== null && r.goalsAgainst !== null && r.note !== 'cancelled';
  const ours = r.goalsFor ?? 0;
  const theirs = r.goalsAgainst ?? 0;
  const outcome = r.note ? t.notes[r.note] : ours > theirs ? t.win : ours < theirs ? t.loss : t.draw;
  return `<li><div class="grid grid-cols-[4.25rem_1fr_auto] items-center gap-x-4 border-b border-line py-4 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-x-6 sm:px-2">
  <span class="nums leading-tight"><span class="block text-xs font-semibold uppercase tracking-wider text-ink-soft">${esc(weekday)}</span><span class="display block text-2xl sm:text-3xl">${esc(day)}</span></span>
  <span class="min-w-0">
    ${teamLabel ? `<span class="block text-xs font-semibold uppercase tracking-wider text-club">${esc(teamLabel)}</span>` : ''}
    <span class="mt-0.5 block truncate text-[15px] font-semibold sm:text-base">${r.isHome ? '' : `<span class="font-normal text-ink-soft">${esc(t.vs)} </span>`}${esc(r.opponent)}</span>
    <span class="mt-0.5 block text-xs text-ink-soft">${esc(r.competition)}</span>
  </span>
  <span class="text-end">
    ${scored ? `<span class="nums display block text-2xl sm:text-3xl" dir="ltr">${ours}:${theirs}</span>` : ''}
    <span class="mt-0.5 inline-block text-[11px] font-semibold uppercase tracking-wider ${scored && ours > theirs ? 'text-ink' : 'text-ink-soft'}">${esc(outcome)}</span>
  </span>
</div></li>`;
}

/**
 * Mannschaftsseite: eine Zeitleiste. Oben die letzten Ergebnisse (älteste zuerst), dann eine
 * Trennlinie "Heute", darunter die nächsten Spiele. Ohne eingetragene Ergebnisse bleibt
 * einfach der Spielplan stehen.
 */
export function seasonList(games: Game[] | null, results: Result[] | undefined, t: FixturesLabels, recent = 3) {
  const past = (results ?? []).slice(0, recent).reverse();
  if (past.length === 0) return gamesList(games, t);
  const divider = `<li class="flex items-center gap-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink" aria-hidden="true"><span class="h-px flex-1 bg-ink"></span>${esc(t.today)}<span class="h-px flex-1 bg-ink"></span></li>`;
  const upcoming = !games
    ? `<li><p class="py-6 text-sm text-ink-soft">${esc(t.unavailable)}</p></li>`
    : games.length === 0
      ? `<li><p class="py-6 text-sm text-ink-soft">${esc(t.noGames)}</p></li>`
      : games.map((g) => gameRow(g, t)).join('');
  const note = games?.some((g) => g.provisional) ? `<p class="mt-3 text-xs text-ink-soft">${esc(t.provisional)}</p>` : '';
  return `<ul class="border-t border-line">${past.map((r) => resultRow(r, t)).join('')}${divider}${upcoming}</ul>${note}`;
}

/** Startseite: das letzte Ergebnis jeder Mannschaft, neuestes zuerst. */
export function latestResults(results: Record<string, Result[]>) {
  return Object.entries(results)
    .map(([slug, list]) => (list[0] ? { slug, r: list[0] } : null))
    .filter((x): x is { slug: string; r: Result } => !!x)
    .sort((a, b) => b.r.date.localeCompare(a.r.date));
}

export function gamesList(games: Game[] | null, t: FixturesLabels) {
  if (!games) return `<p class="py-6 text-sm text-ink-soft">${esc(t.unavailable)}</p>`;
  if (games.length === 0) return `<p class="py-6 text-sm text-ink-soft">${esc(t.noGames)}</p>`;
  const note = games.some((g) => g.provisional) ? `<p class="mt-3 text-xs text-ink-soft">${esc(t.provisional)}</p>` : '';
  return `<ul class="border-t border-line">${games.map((g) => gameRow(g, t)).join('')}</ul>${note}`;
}

export function leagueTable(table: TeamFixtures['table'], t: FixturesLabels) {
  if (!table || table.rows.length === 0) return `<p class="py-6 text-sm text-ink-soft">${esc(t.unavailable)}</p>`;
  const rows = table.rows
    .map(
      (r) => `<tr class="${r.isUs ? 'bg-ink text-paper' : 'border-b border-line'}">
  <td class="nums relative py-2.5 ps-3 pe-2 text-end font-semibold">${r.zone ? `<span class="absolute inset-y-1.5 start-0 w-[3px] rounded-sm ${r.zone === 'up' ? 'bg-club' : 'bg-ink-soft/50'} ${r.isUs ? 'bg-paper' : ''}" aria-hidden="true"></span>` : ''}${r.rank}</td>
  <td class="max-w-0 truncate py-2.5 pe-2 ${r.isUs ? 'font-bold' : ''}">${esc(r.club)}</td>
  <td class="nums py-2.5 px-2 text-end ${r.isUs ? '' : 'text-ink-soft'}">${r.played}</td>
  <td class="nums hidden py-2.5 px-2 text-end sm:table-cell ${r.isUs ? '' : 'text-ink-soft'}">${r.goalsFor}:${r.goalsAgainst}</td>
  <td class="nums py-2.5 px-2 text-end ${r.isUs ? '' : 'text-ink-soft'}">${r.diff > 0 ? '+' : ''}${r.diff}</td>
  <td class="nums py-2.5 ps-2 pe-3 text-end font-bold">${r.points}</td>
</tr>`,
    )
    .join('');
  return `<div class="overflow-x-auto"><table class="w-full table-fixed border-collapse text-sm">
  <caption class="sr-only">${esc(t.table.caption)}${table.season ? ` ${esc(table.season)}` : ''}</caption>
  <colgroup><col class="w-12" /><col /><col class="w-11" /><col class="hidden w-16 sm:table-column" /><col class="w-12" /><col class="w-12" /></colgroup>
  <thead><tr class="border-b-2 border-ink text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
    <th scope="col" class="py-2 ps-3 pe-2 text-end">${esc(t.table.rank)}</th>
    <th scope="col" class="py-2 pe-2 text-start">${esc(t.table.club)}</th>
    <th scope="col" class="py-2 px-2 text-end">${esc(t.table.played)}</th>
    <th scope="col" class="hidden py-2 px-2 text-end sm:table-cell">${esc(t.table.goals)}</th>
    <th scope="col" class="py-2 px-2 text-end">${esc(t.table.diff)}</th>
    <th scope="col" class="py-2 ps-2 pe-3 text-end">${esc(t.table.points)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table></div>`;
}
