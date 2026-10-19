// Schutz der E-Mail-Adressen vor Adress-Sammlern.
//
// Im ausgelieferten HTML steht keine Adresse im Klartext und kein mailto-Link. Die Adresse liegt
// umgedreht und Base64-kodiert in data-email; erst src/lib/revealEmails.ts baut im Browser daraus
// den Link und den sichtbaren Text. Ohne JavaScript bleibt eine lesbare Form wie
// "kontakt [at] fc-treptow.de" stehen.
//
// Das hält einfache Sammler ab, die das HTML nach name@domain durchsuchen. Gegen Bots mit echtem
// Browser hilft es nicht; dafür ist der Spamfilter des Postfachs da.

const reverse = (s: string) => [...s].reverse().join('');

/** Kodiert eine Adresse für data-email bzw. data-to. */
export const encodeEmail = (address: string) => btoa(reverse(address.trim()));

/** Gegenstück zu encodeEmail, läuft im Browser. */
export const decodeEmail = (encoded: string) => reverse(atob(encoded));

/** Lesbare Form ohne @, für das HTML vor dem Nachladen und für Besucher ohne JavaScript. */
export const emailDisplay = (address: string) => address.trim().replace('@', ' [at] ');

/** Attribute für ein <a>, das revealEmails.ts zum mailto-Link macht. */
export const emailAttrs = (address: string, subject?: string) => ({
  'data-email': encodeEmail(address),
  ...(subject ? { 'data-email-subject': subject } : {}),
});
