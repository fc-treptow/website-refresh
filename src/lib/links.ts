import { getEntry } from 'astro:content';

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

// Kontaktadressen, gepflegt im CMS unter Einstellungen > Kontakt
// (src/content/einstellungen/kontakt.yml).
export async function getContacts() {
  const entry = await getEntry('kontakt', 'kontakt');
  if (!entry) throw new Error('src/content/einstellungen/kontakt.yml fehlt');
  return entry.data;
}
