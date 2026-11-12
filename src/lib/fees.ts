import { getEntry } from 'astro:content';
import type { Locale } from '../i18n/languages';

// Mitgliedsbeiträge, gepflegt im CMS unter Einstellungen › Beiträge
// (src/content/einstellungen/beitraege.yml). Stehen auf der Seite Mitgliedschaft und auf der
// Startseite ("ab … € im Monat"). Die Texte enthalten nur Platzhalter, deshalb muss bei einer
// Beitragsänderung nichts übersetzt werden.
export async function getFees() {
  const entry = await getEntry('beitraege', 'beitraege');
  if (!entry) throw new Error('src/content/einstellungen/beitraege.yml fehlt');
  return entry.data;
}

const numberLocale: Record<Locale, string> = { de: 'de', en: 'en', tr: 'tr', ar: 'ar-u-nu-latn', es: 'es', fr: 'fr' };

// Betrag ohne Währungszeichen: ganze Euro ohne Nachkommastellen, sonst zwei (12,50)
export const amount = (n: number, lang: Locale) =>
  Number.isInteger(n)
    ? String(n)
    : n.toLocaleString(numberLocale[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 });
