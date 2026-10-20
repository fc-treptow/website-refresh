export const locales = ['de', 'en', 'tr', 'ar', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export const rtlLocales: Locale[] = ['ar'];

export const languageNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
};

export function isRtl(locale: Locale) {
  return rtlLocales.includes(locale);
}

// /en/mannschaften -> Pfad ohne Sprachpräfix, mit führendem Slash
export function pathWithoutLocale(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && locales.includes(parts[0] as Locale) && parts[0] !== defaultLocale) {
    return '/' + parts.slice(1).join('/');
  }
  return pathname;
}

// Baut die URL für dieselbe Seite in einer anderen Sprache
export function localizedPath(pathname: string, target: Locale) {
  const bare = pathWithoutLocale(pathname);
  const clean = bare === '' ? '/' : bare;
  if (target === defaultLocale) return clean;
  return `/${target}${clean === '/' ? '' : clean}`;
}

// Interner Link in der aktuellen Sprache: l('de', '/news') -> '/news', l('en', '/news') -> '/en/news'
export function l(locale: Locale, path: string) {
  if (locale === defaultLocale) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export const bcp47: Record<Locale, string> = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR', ar: 'ar-EG', es: 'es-ES', fr: 'fr-FR' };

// Open Graph erwartet Sprache_Land (de_DE), nicht nur die Sprache. Facebook kennt für Arabisch nur ar_AR.
export const ogLocale: Record<Locale, string> = { de: 'de_DE', en: 'en_GB', tr: 'tr_TR', ar: 'ar_AR', es: 'es_ES', fr: 'fr_FR' };
