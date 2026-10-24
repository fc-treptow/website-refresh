// @ts-check
// Spam-Schutz mit ALTCHA (Open Source, läuft komplett auf unserem Server, keine Cookies,
// kein Fremddienst). Der Browser löst im Hintergrund eine kleine Rechenaufgabe; der Server
// prüft die Lösung und die Signatur. Genutzt von api/altcha.mjs und api/probetraining.mjs.
//
// Umgebungsvariablen in Vercel:
//   ALTCHA_HMAC_KEY   geheimer Schlüssel, beliebige lange Zufallszeichenkette (Pflicht)
//   ALTCHA_DIFFICULTY optional, Standard 5000. Höher = mehr Rechenarbeit für Bots und Menschen.
//                     Das Lösen beginnt beim Laden der Seite, Menschen merken davon nichts.

import { createChallenge, randomInt, verifySolution } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';

const ALGORITHM = 'PBKDF2/SHA-256';
const COST = 5_000;
// Eine Aufgabe gilt zehn Minuten. Wer länger für das Formular braucht, bekommt beim Absenden
// automatisch eine neue (siehe ProbetrainingSections.astro).
const VALID_SECONDS = 10 * 60;
// Menschen brauchen für das Formular mehr als ein paar Sekunden, Skripte nicht.
export const MIN_FILL_MS = 3_000;

function secrets() {
  const key = process.env.ALTCHA_HMAC_KEY;
  if (!key) throw new Error('ALTCHA_HMAC_KEY fehlt');
  return key;
}

export async function newChallenge() {
  const key = secrets();
  const max = Math.max(1_000, Number(process.env.ALTCHA_DIFFICULTY) || 5_000);
  return createChallenge({
    algorithm: ALGORITHM,
    cost: COST,
    counter: randomInt(max, Math.floor(max / 2)),
    deriveKey,
    // Zeitpunkt der Ausgabe, signiert: so lässt sich die Mindestzeit fälschungssicher prüfen.
    data: { t: Date.now() },
    expiresAt: Math.floor(Date.now() / 1000) + VALID_SECONDS,
    hmacSignatureSecret: key,
  });
}

/**
 * Prüft die vom Widget gelieferte Lösung (Base64-JSON im Feld "altcha").
 * @param {unknown} payload
 * @returns {Promise<{ ok: boolean, issuedAt?: number }>}
 */
export async function checkSolution(payload) {
  if (typeof payload !== 'string' || payload.length > 4_000) return { ok: false };
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return { ok: false };
  }
  if (!parsed?.challenge || !parsed?.solution) return { ok: false };
  const key = secrets();
  try {
    const result = await verifySolution({
      challenge: parsed.challenge,
      solution: parsed.solution,
      deriveKey,
      hmacSignatureSecret: key,
    });
    if (!result.verified) return { ok: false };
  } catch {
    return { ok: false };
  }
  const issuedAt = Number(parsed.challenge?.parameters?.data?.t);
  return { ok: Number.isFinite(issuedAt), issuedAt };
}
