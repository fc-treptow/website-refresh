// Formularversand ohne Fremddienst.
//
// Hintergrund: Die Anmeldung erhebt personenbezogene Daten (Name, Geburtsdatum,
// Anschrift). Der datenschutzrechtlich einfachste Weg für einen kleinen Verein ist,
// diese Daten direkt an das eigene Postfach zu schicken, ohne einen Auftragsverarbeiter
// dazwischen. Deshalb ist der Standardweg eine vorausgefüllte E-Mail.
//
// Sobald der Verein einen Formulardienst nutzen möchte (z. B. Formspree oder
// Web3Forms), genügt es, PUBLIC_FORM_ENDPOINT als Umgebungsvariable zu setzen. Dann
// wird das Formular per fetch dorthin geschickt und die E-Mail entfällt.
// Wichtig: Ein solcher Dienst braucht dann einen Auftragsverarbeitungsvertrag.

import { decodeEmail } from './email';

// Die Zieladresse steht kodiert im data-to des Formulars (siehe src/lib/email.ts), damit sie
// weder im HTML noch im ausgelieferten Skript im Klartext steht.

export type SubmitResult = { kind: 'sent' } | { kind: 'mail-client'; href: string };

function collect(form: HTMLFormElement): Array<[string, string]> {
  const data = new FormData(form);
  const rows: Array<[string, string]> = [];
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string' && value.trim() !== '') {
      const el = form.elements.namedItem(key);
      const id = el instanceof Element ? el.id : '';
      const label = id ? form.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() : undefined;
      rows.push([label || key, value.trim()]);
    }
  }
  return rows;
}

export async function submitForm(form: HTMLFormElement, subject: string): Promise<SubmitResult> {
  const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT;
  const rows = collect(form);

  if (endpoint) {
    const payload: Record<string, string> = { _subject: subject };
    for (const [key, value] of rows) payload[key] = value;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Formularversand fehlgeschlagen: ${res.status}`);
    return { kind: 'sent' };
  }

  // Kein Endpunkt konfiguriert: vorausgefüllte E-Mail an das Vereinspostfach öffnen.
  const body = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const href = `mailto:${decodeEmail(form.dataset.to ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  return { kind: 'mail-client', href };
}
