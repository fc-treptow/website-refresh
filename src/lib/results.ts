// Ergebnisse aus dem CMS (src/content/ergebnisse), je Mannschaft, neuestes zuerst. Nur die
// laufende Saison (ab 1. Juli). Enthält auch angelegte, noch nicht gespielte Spiele; welche davon
// schon zu sehen sind, entscheidet played() in fixturesView.ts, beim Build und im Browser.
import { getCollection } from 'astro:content';
import { getTeams, leagueLabel } from '../i18n/content';
import type { Locale } from '../i18n/languages';
import type { Result } from './fixturesView';

export async function getResults(lang: Locale): Promise<Record<string, Result[]>> {
  const [entries, teams] = await Promise.all([getCollection('ergebnisse'), getTeams('de')]);
  const league = Object.fromEntries(teams.map((t) => [t.slug, t.data.league]));
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const year = Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 7 ? 1 : 0);
  const seasonStart = `${year}-07-01`;
  const bySlug: Record<string, Result[]> = {};
  for (const { data: e } of entries) {
    // Mannschaft gelöscht oder umbenannt: Eintrag still übergehen statt den Build zu brechen
    if (!(e.team in league)) continue;
    const date = e.date.toISOString().slice(0, 10);
    if (date < seasonStart) continue;
    (bySlug[e.team] ??= []).push({
      date,
      time: e.time ? e.time.replace('.', ':').padStart(5, '0') : null,
      opponent: e.opponent,
      isHome: e.isHome,
      goalsFor: e.goalsFor ?? null,
      goalsAgainst: e.goalsAgainst ?? null,
      competition: e.competition?.trim() || leagueLabel(league[e.team], lang),
      note: e.note ?? null,
      url: e.fussballDeUrl ?? null,
    });
  }
  for (const list of Object.values(bySlug)) list.sort((a, b) => `${b.date}${b.time ?? ''}`.localeCompare(`${a.date}${a.time ?? ''}`));
  return bySlug;
}
