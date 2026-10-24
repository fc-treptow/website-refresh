// Formularversand an eine eigene Vercel-Funktion (z. B. api/probetraining.mjs).
// Die Funktion prüft alles noch einmal und verschickt die E-Mails über das Vereinskonto
// noreply@. Es läuft kein Fremddienst dazwischen.

export class FormError extends Error {
  constructor(
    readonly code: string,
    readonly field?: string,
  ) {
    super(`Formularversand fehlgeschlagen: ${code}`);
  }
}

export async function postForm(url: string, payload: Record<string, unknown>): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new FormError('network');
  }
  if (res.ok) return;
  const body = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
  throw new FormError(body.error ?? `http_${res.status}`, body.field);
}
