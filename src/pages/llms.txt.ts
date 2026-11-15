// llms.txt (https://llmstxt.org): kurze Übersicht für KI-Assistenten, was der Verein ist und wo
// die wichtigsten Seiten liegen. Stammdaten aus src/data/club.ts, Mannschaften und Trainingszeiten
// aus dem CMS, damit nichts veraltet.
import type { APIRoute } from 'astro';
import { club } from '../data/club';
import { getTeams, leagueLabel, trainingLabel } from '../i18n/content';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://fct-website-refresh.vercel.app');
  const abs = (p: string) => new URL(p, base).href;
  const teams = await getTeams('de');

  const body = [
    `# ${club.name}`,
    '',
    `> Der ${club.name} (${club.legalName}) ist ein Fußballverein aus Berlin-Baumschulenweg im Bezirk Treptow-Köpenick. Die Vereinsgeschichte reicht bis ${club.founded} zurück. Gespielt und trainiert wird auf der ${club.ground.name}, ${club.ground.street}, ${club.ground.city}. Der Verein hat nur Herrenmannschaften (ab 18 Jahren).`,
    '',
    'Neue Spieler kommen über ein kostenloses Probetraining. Bei den Ligateams entscheidet danach der Trainer, ob und wo es passt; bei den Freizeit Kickers gibt es keine Auswahl. Vor dem ersten Mal bitte kurz über das Formular oder per E-Mail melden.',
    '',
    '## Mitmachen',
    '',
    `- [Probetraining](${abs('/probetraining')}): Ablauf und Formular für ein kostenloses Probetraining`,
    `- [Mitgliedschaft](${abs('/mitgliedschaft')}): Beiträge, Ablauf und Anmeldung`,
    `- [Schiedsrichter](${abs('/schiedsrichter')}): Schiedsrichter werden, Ausbildung beim Berliner Fußball-Verband`,
    `- [Kontakt](${abs('/kontakt')}): E-Mail, Anfahrt und Trainingszeiten`,
    '',
    '## Mannschaften',
    '',
    ...teams.map((t) => `- [${t.data.name}](${abs(`/mannschaften/${t.slug}`)}): ${leagueLabel(t.data.league, 'de')}; Training ${t.data.training.map((s) => trainingLabel(s, 'de')).join(' und ')}`),
    '',
    '## Verein',
    '',
    `- [News](${abs('/news')}): Spielberichte und Vereinsleben`,
    `- [Vereinschronik](${abs('/vereinschronik')}): Geschichte seit ${club.founded}`,
    `- [Vorstand](${abs('/vorstand')}): ehrenamtlicher Vorstand und Ansprechpartner`,
    '',
    '## Sprachen',
    '',
    `- Die Seite gibt es auf Deutsch, Englisch (${abs('/en')}), Türkisch, Arabisch, Spanisch und Französisch.`,
    '',
    '## Optional',
    '',
    `- [fussball.de](${club.fussballDeClubUrl}): Spielpläne und Tabellen`,
    `- [Instagram](${club.social.instagram})`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
