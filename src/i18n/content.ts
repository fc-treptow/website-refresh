import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from './languages';

// Inhalte werden auf Deutsch gepflegt (src/content/<sammlung>/de/<slug>.md).
// Übersetzungen liegen unter src/content/<sammlung>/<sprache>/<slug>.md und sind freiwillig:
// Fehlt eine, erscheint der deutsche Eintrag. Neue Beiträge sind so sofort in allen Sprachen
// sichtbar, auch wenn niemand übersetzt.

const slugOf = (id: string) => id.slice(id.indexOf('/') + 1);
const localeOf = (id: string) => id.slice(0, id.indexOf('/'));

export type LocalizedNews = CollectionEntry<'news'> & { slug: string; isFallback: boolean };

export async function getNews(lang: Locale): Promise<LocalizedNews[]> {
  const all = await getCollection('news');
  const german = all.filter((e) => localeOf(e.id) === defaultLocale);
  return german
    .map((de) => {
      const slug = slugOf(de.id);
      const local = lang === defaultLocale ? null : all.find((e) => e.id === `${lang}/${slug}`);
      const entry = local ?? de;
      // Galerie: Fotos immer aus dem deutschen Eintrag, Texte aus der Übersetzung, falls vorhanden
      const gallery = de.data.gallery.map((g, i) => ({
        ...g,
        alt: local?.data.galleryAlt?.[i] || g.alt,
        caption: local?.data.galleryCaption?.[i] || g.caption,
      }));
      return { ...entry, data: { ...entry.data, gallery }, slug, isFallback: lang !== defaultLocale && !local };
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export type LocalizedTeam = CollectionEntry<'teams'> & {
  slug: string;
  /** Eintrag, dessen Text (Body) gerendert wird: Übersetzung oder Deutsch */
  bodyEntry: CollectionEntry<'teams'> | CollectionEntry<'teamsI18n'>;
};

export async function getTeams(lang: Locale): Promise<LocalizedTeam[]> {
  const teams = await getCollection('teams');
  const i18n = lang === defaultLocale ? [] : await getCollection('teamsI18n');
  return teams
    .map((team) => {
      const slug = slugOf(team.id);
      const local = i18n.find((e) => e.id === `${lang}/${slug}`);
      const gallery = team.data.gallery.map((g, i) => ({ ...g, alt: local?.data.galleryAlt?.[i] ?? g.alt }));
      return {
        ...team,
        slug,
        data: { ...team.data, shortName: local?.data.shortName ?? team.data.shortName, gallery },
        bodyEntry: local && local.body?.trim() ? local : team,
      };
    })
    .sort((a, b) => a.data.order - b.data.order);
}

// Ligabezeichnung aus dem deutschen Eintrag in die jeweilige Sprache bringen.
// "Kreisliga B, Staffel 5" bleibt als Eigenname stehen, nur "Staffel" und "7er" werden übersetzt.
const leagueWords: Record<Locale, { staffel: string; seven: (s: string) => string; hobby: string }> = {
  de: { staffel: 'Staffel', seven: (s) => `7er-${s}`, hobby: 'Hobbymannschaft' },
  en: { staffel: 'Group', seven: (s) => `${s} (7-a-side)`, hobby: 'Recreational team' },
  tr: { staffel: 'Grup', seven: (s) => `${s} (7’li)`, hobby: 'Hobi takımı' },
  ar: { staffel: 'المجموعة', seven: (s) => `${s} (سباعي)`, hobby: 'فريق هواة' },
  es: { staffel: 'Grupo', seven: (s) => `${s} (fútbol 7)`, hobby: 'Equipo recreativo' },
  fr: { staffel: 'Groupe', seven: (s) => `${s} (foot à 7)`, hobby: 'Équipe loisir' },
};

export function leagueLabel(league: string, lang: Locale) {
  if (lang === defaultLocale) return league;
  const w = leagueWords[lang];
  if (/^hobby/i.test(league.trim())) return w.hobby;
  const m = league.match(/^(7er-)?(.*?)(?:,\s*Staffel\s*(\d+))?$/);
  if (!m) return league;
  const [, seven, name, staffel] = m;
  const base = seven ? w.seven(name) : name;
  return staffel ? `${base}, ${w.staffel} ${staffel}` : base;
}

// Trainingszeit "Dienstag 19:30 bis 21:00" in der jeweiligen Sprache
const dayIndex = { Montag: 1, Dienstag: 2, Mittwoch: 3, Donnerstag: 4, Freitag: 5, Samstag: 6, Sonntag: 7 } as const;
const bcp: Record<Locale, string> = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR', ar: 'ar-EG', es: 'es-ES', fr: 'fr-FR' };
const until: Record<Locale, string> = { de: 'bis', en: 'to', tr: '–', ar: 'حتى', es: 'a', fr: 'à' };

export function dayName(day: keyof typeof dayIndex, lang: Locale, style: 'long' | 'short' = 'long') {
  // 2024-01-01 war ein Montag
  const d = new Date(Date.UTC(2024, 0, dayIndex[day], 12));
  return d.toLocaleDateString(bcp[lang], { weekday: style, timeZone: 'UTC' });
}

function clock(t: string, lang: Locale) {
  const [h, m] = t.replace('.', ':').split(':').map(Number);
  if (lang === 'fr') return `${h}h${String(m).padStart(2, '0')}`;
  if (lang === 'en' || lang === 'ar') {
    const d = new Date(Date.UTC(2024, 0, 1, h, m));
    return d.toLocaleTimeString(bcp[lang], { hour: 'numeric', minute: '2-digit', hour12: lang === 'en', timeZone: 'UTC' });
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function trainingLabel(slot: { day: keyof typeof dayIndex; from: string; to: string }, lang: Locale) {
  const suffix = lang === 'de' ? ' Uhr' : '';
  return `${dayName(slot.day, lang)}, ${clock(slot.from, lang)} ${until[lang]} ${clock(slot.to, lang)}${suffix}`;
}
