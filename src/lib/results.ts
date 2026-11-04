// Ergebnisse aus dem CMS (src/content/ergebnisse), je Mannschaft, neuestes zuerst.
import { getCollection } from 'astro:content';
import { getTeams, leagueLabel } from '../i18n/content';
import type { Locale } from '../i18n/languages';
import type { Result } from './fixturesView';

export async function getResults(lang: Locale): Promise<Record<string, Result[]>> {
  const [entries, teams] = await Promise.all([getCollection('ergebnisse'), getTeams('de')]);
  const league = Object.fromEntries(teams.map((t) => [t.slug, t.data.league]));
  const bySlug: Record<string, Result[]> = {};
  for (const { data: e } of entries) {
    // Mannschaft gelöscht oder umbenannt: Eintrag still übergehen statt den Build zu brechen
    if (!(e.team in league)) continue;
    (bySlug[e.team] ??= []).push({
      date: e.date.toISOString().slice(0, 10),
      opponent: e.opponent,
      isHome: e.isHome,
      goalsFor: e.goalsFor ?? null,
      goalsAgainst: e.goalsAgainst ?? null,
      competition: e.competition?.trim() || leagueLabel(league[e.team], lang),
      note: e.note ?? null,
    });
  }
  for (const list of Object.values(bySlug)) list.sort((a, b) => b.date.localeCompare(a.date));
  return bySlug;
}
