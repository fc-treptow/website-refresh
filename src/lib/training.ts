import { getCollection } from 'astro:content';
import { weekdays } from '../content.config';
import type { Locale } from '../i18n/languages';

// Trainingstage und -zeiten des Vereins, abgeleitet aus den Mannschaften im CMS
// (Mannschaften › Trainingszeiten). Stehen auf Kontakt, Mitgliedschaft und Probetraining.
// Ändert eine Mannschaft ihre Zeiten, stimmen diese Seiten automatisch.
//
// In den Texten (src/i18n/pages.ts) stehen dafür Platzhalter:
//   {days}    Trainingstage, mit "und" verbunden  (Dienstag und Donnerstag)
//   {daysOr}  Trainingstage, mit "oder" verbunden (Dienstag oder Donnerstag)
//   {from}    frühester Trainingsbeginn           (18:00)
//   {to}      spätestes Trainingsende             (21:00)

// Arabisch mit westlichen Ziffern, wie im Rest der Seite
const intlLocale: Record<Locale, string> = { de: 'de', en: 'en', tr: 'tr', ar: 'ar-u-nu-latn', es: 'es', fr: 'fr' };
// Wochentage stehen mitten im Satz: im Türkischen klein, im Deutschen und Englischen groß
const lowerDays: Locale[] = ['tr'];

const minutes = (t: string) => {
  const [h, m] = t.split(/[:.]/).map(Number);
  return h * 60 + m;
};

export async function getTraining(lang: Locale) {
  const teams = await getCollection('teams');
  const slots = teams.flatMap((t) => t.data.training);
  if (slots.length === 0) throw new Error('Keine Mannschaft hat Trainingszeiten eingetragen.');

  const loc = intlLocale[lang];
  // 1. Januar 2024 war ein Montag: Index 0 = Montag, wie in weekdays
  const dayName = (i: number) => {
    const name = new Intl.DateTimeFormat(loc, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i)));
    return lowerDays.includes(lang) ? name.toLocaleLowerCase(loc) : name;
  };
  const dayIdx = [...new Set(slots.map((s) => weekdays.indexOf(s.day)))].sort((a, b) => a - b);
  const names = dayIdx.map(dayName);

  const time = (min: number) =>
    new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', hour12: lang === 'en', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 1, Math.floor(min / 60), min % 60)));
  const from = time(Math.min(...slots.map((s) => minutes(s.from))));
  const to = time(Math.max(...slots.map((s) => minutes(s.to))));

  const days = new Intl.ListFormat(loc, { type: 'conjunction' }).format(names);
  const daysOr = new Intl.ListFormat(loc, { type: 'disjunction' }).format(names);

  const fill = (text: string) =>
    text.replaceAll('{days}', days).replaceAll('{daysOr}', daysOr).replaceAll('{from}', from).replaceAll('{to}', to);
  // Für Texte, die mit den Wochentagen beginnen (frz., span., türk. Wochentage sind klein)
  const fillStart = (text: string) => {
    const s = fill(text);
    return s.charAt(0).toLocaleUpperCase(loc) + s.slice(1);
  };
  return { days, daysOr, from, to, fill, fillStart };
}
