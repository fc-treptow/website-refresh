// Vercel-Funktion: nimmt eine Probetraining-Anfrage entgegen und verschickt zwei E-Mails
// über das Google-Workspace-Konto noreply@ (SMTP mit App-Passwort):
//   1. an kontakt@ und, falls im CMS hinterlegt, an die Kontakt-E-Mail der Wunsch-Mannschaft
//   2. eine Eingangsbestätigung an die angegebene Adresse
// Es wird nichts gespeichert und nichts aus dem Formular geloggt.
//
// Umgebungsvariablen in Vercel:
//   SMTP_USER        noreply@fc-treptow.de
//   SMTP_PASS        App-Passwort von noreply@ (16 Zeichen, ohne Leerzeichen)
//   SMTP_HOST        optional, Standard smtp.gmail.com
//   MAIL_TO          optional, Standard kontakt@fc-treptow.de
//   ALTCHA_HMAC_KEY  siehe src/lib/altcha.mjs
//   MAIL_DRY_RUN=1   nur lokal zum Testen: Mails werden nicht verschickt, sondern ausgegeben
import nodemailer from 'nodemailer';
import { checkSolution, MIN_FILL_MS } from '../src/lib/altcha.mjs';
import { validateTrial } from '../src/lib/trialValidate.mjs';
import { clubMail, confirmMail } from '../src/lib/trialMail.mjs';
import { formTeams } from './_teams.mjs';

const MAX_BODY = 10_000;
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return host === new URL(request.url).host || host === request.headers.get('x-forwarded-host') || host === request.headers.get('host');
  } catch {
    return false;
  }
}

function transport() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) throw new Error('SMTP_USER oder SMTP_PASS fehlt');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s/g, '') },
  });
}

export async function POST(request) {
  // Nur Anfragen von unserer eigenen Seite
  if (!sameOrigin(request)) return json({ error: 'origin' }, 403);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'invalid' }, 400);

  // Verstecktes Feld: Menschen sehen es nicht, Bots füllen es aus. Bots bekommen "ok", damit
  // sie nicht lernen, woran es lag.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });

  const proof = await checkSolution(body.altcha);
  if (!proof.ok) return json({ error: 'spam' }, 403);
  if (Date.now() - (proof.issuedAt ?? 0) < MIN_FILL_MS) return json({ error: 'spam' }, 403);

  const checked = validateTrial(body, formTeams);
  if (!checked.ok) return json({ error: 'validation', field: checked.field }, 400);
  const r = checked.data;
  const team = r.team ? formTeams[r.team] : undefined;

  const user = process.env.SMTP_USER || 'noreply@fc-treptow.de';
  const clubTo = (process.env.MAIL_TO || 'kontakt@fc-treptow.de').toLowerCase();
  const recipients = [clubTo];
  if (team?.contact && team.contact !== clubTo) recipients.push(team.contact);
  const origin = process.env.SITE_URL || new URL(request.url).origin;

  let mailer;
  try {
    mailer = transport();
    const club = clubMail(r, team);
    const info = await mailer.sendMail({
      from: { name: 'FC Treptow Probetraining', address: user },
      to: recipients,
      replyTo: { name: r.name, address: r.email },
      subject: club.subject,
      text: club.text,
    });
    if (process.env.MAIL_DRY_RUN === '1') console.log(info.message.toString());
  } catch (err) {
    console.error('probetraining: Mail an den Verein fehlgeschlagen', err instanceof Error ? err.message : err);
    return json({ error: 'send' }, 502);
  }

  // Die Bestätigung ist nett, aber nicht entscheidend: Schlägt sie fehl, gilt die Anfrage trotzdem.
  try {
    const confirm = confirmMail(r, team, r.team, origin);
    const info = await mailer.sendMail({
      from: { name: 'FC Treptow Probetraining', address: user },
      to: r.email,
      replyTo: clubTo,
      subject: confirm.subject,
      text: confirm.text,
    });
    if (process.env.MAIL_DRY_RUN === '1') console.log(info.message.toString());
  } catch (err) {
    console.error('probetraining: Bestätigung fehlgeschlagen', err instanceof Error ? err.message : err);
  }

  return json({ ok: true });
}
