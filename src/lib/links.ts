import { getCollection, getEntry } from 'astro:content';

// Adressen externer Dienste, gepflegt im CMS unter Einstellungen > Links
// (src/content/einstellungen/links.yml).
export async function getLinks() {
  const entry = await getEntry('einstellungen', 'links');
  if (!entry) throw new Error('src/content/einstellungen/links.yml fehlt');
  return entry.data;
}

// Domain für Hinweise unter externen Links, ohne "www."
export const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');

// Ersetzt {host} in einem Hinweistext und liefert die Teile davor und danach,
// damit die Domain im Markup eigens ausgezeichnet werden kann (<bdi> für Arabisch).
export const splitHost = (text: string) => {
  const [before, after = ''] = text.split('{host}');
  return { before, after };
};

// tel:-Link aus einer angezeigten Nummer: nur Ziffern und +, deutsche Nummern mit +49 statt 0
export const telHref = (p: string) =>
  `tel:${p.replace(/[^\d+]/g, '').replace(/^00/, '+').replace(/^0/, '+49')}`;

// Kontaktadressen, gepflegt im CMS unter Einstellungen > Kontakt
// (src/content/einstellungen/kontakt.yml). Ist keine Telefonnummer eingetragen,
// sind phone und phoneHref null und die Nummer wird nirgends angezeigt.
export async function getContacts() {
  const entry = await getEntry('kontakt', 'kontakt');
  if (!entry) throw new Error('src/content/einstellungen/kontakt.yml fehlt');
  const phone = entry.data.phone?.trim() || null;
  return { ...entry.data, phone, phoneHref: phone ? telHref(phone) : null };
}

// Vertretungsberechtigte Personen (1. und 2. Vorsitzende/r), gepflegt im CMS unter Vorstand.
// Stehen im Impressum und in der Datenschutzerklärung. Fehlt ein Amt, bricht der Build ab,
// statt ein unvollständiges Impressum zu veröffentlichen.
export async function getRepresentatives() {
  const board = await getCollection('vorstand');
  const holder = (role: 'chair' | 'viceChair') => {
    const people = board.filter((p) => p.data.role === role).sort((a, b) => a.data.order - b.data.order);
    if (people.length === 0) throw new Error(`Im Vorstand fehlt eine Person mit dem Amt "${role}" (Impressum, Datenschutz).`);
    return people[0].data.name;
  };
  return { chair: holder('chair'), viceChair: holder('viceChair') };
}
