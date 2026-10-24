// Vercel-Funktion: gibt eine neue ALTCHA-Aufgabe für das Probetraining-Formular aus.
// Das Widget im Browser holt sie beim Laden der Seite und löst sie im Hintergrund.
import { newChallenge } from '../src/lib/altcha.mjs';

export async function GET() {
  try {
    return Response.json(await newChallenge(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('altcha: Aufgabe konnte nicht erzeugt werden', err instanceof Error ? err.message : err);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
