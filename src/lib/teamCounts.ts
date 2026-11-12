import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/languages';
import { useTranslations } from '../i18n/ui';

// Zahl der Mannschaften in Texten (Auftakt der Startseite, Seite Mannschaften), abgeleitet aus
// den Mannschaften im CMS. Freizeitmannschaften erkennt die Seite an der Liga "Hobbymannschaft",
// alle anderen zählen als Herrenteams. Kommt ein Team dazu oder fällt eines weg, stimmen die Texte.
//
// Platzhalter:
//   {teams}  "Drei Herrenteams, eine Freizeitmannschaft" (nur Zahlen in Worten)
//   {men}    "drei Herrenteams"
//   {hobby}  Namen der Freizeitmannschaften, z. B. "Freizeit Kickers"
export const isHobby = (league: string) => league.trim().toLowerCase() === 'hobbymannschaft';

const words = (forms: string[], n: number) => (forms[n - 1] ?? forms[forms.length - 1]).replace('{n}', String(n));
const capitalize = (s: string, lang: Locale) => s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);

export async function fillTeamCounts(text: string, lang: Locale) {
  const teams = (await getCollection('teams')).sort((a, b) => a.data.order - b.data.order);
  const hobby = teams.filter((t) => isHobby(t.data.league));
  const menCount = teams.length - hobby.length;
  const w = useTranslations(lang).teamWords;
  const parts = [menCount > 0 ? words(w.men, menCount) : '', hobby.length > 0 ? words(w.hobby, hobby.length) : ''].filter(Boolean);
  const men = menCount > 0 ? words(w.men, menCount) : '';
  const hobbyNames = new Intl.ListFormat(lang, { type: 'conjunction' }).format(hobby.map((t) => t.data.name));
  const filled = text
    .replaceAll('{teams}', parts.join(w.sep))
    .replaceAll('{men}', men)
    .replaceAll('{hobby}', hobbyNames);
  // Texte, die mit einem Platzhalter beginnen, groß anfangen lassen
  return capitalize(filled, lang);
}
