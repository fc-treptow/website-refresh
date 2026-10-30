// @ts-check
// Die beiden E-Mails zum Probetraining, als reiner Text:
// - an den Verein (immer kontakt@, dazu die Kontakt-E-Mail der Wunsch-Mannschaft aus dem CMS)
// - Eingangsbestätigung an die Spielerin oder den Spieler, in der Sprache der Seite
// Genutzt von api/probetraining.mjs. Neue Sprachen hier in confirmTexts ergänzen.

import { whatsappNumber } from './trialValidate.mjs';

/** @typedef {import('./trialValidate.mjs').TrialRequest} TrialRequest */
/** @typedef {{ name: string, contact: string, training: { day: string, from: string, to: string }[] }} FormTeam */

const bcp = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR', ar: 'ar-EG', es: 'es-ES', fr: 'fr-FR' };
const dayIndex = { Montag: 1, Dienstag: 2, Mittwoch: 3, Donnerstag: 4, Freitag: 5, Samstag: 6, Sonntag: 7 };

/** @param {string} day @param {string} lang */
function dayName(day, lang) {
  // 2024-01-01 war ein Montag
  const d = new Date(Date.UTC(2024, 0, dayIndex[/** @type {keyof typeof dayIndex} */ (day)] ?? 1, 12));
  return d.toLocaleDateString(bcp[/** @type {keyof typeof bcp} */ (lang)] ?? 'de-DE', { weekday: 'long', timeZone: 'UTC' });
}

const languageNames = { de: 'Deutsch', en: 'Englisch', tr: 'Türkisch', ar: 'Arabisch', es: 'Spanisch', fr: 'Französisch' };
const contactWayNames = { email: 'E-Mail', phone: 'Telefon', whatsapp: 'WhatsApp' };

/**
 * E-Mail an den Verein. Antworten gehen per Reply-To direkt an die Spielerin oder den Spieler.
 * @param {TrialRequest} r
 * @param {FormTeam | undefined} team
 */
export function clubMail(r, team) {
  const under18 = r.age < 18;
  const subject = `Probetraining: ${r.name}, ${team ? team.name : 'ohne Teamwunsch'}, ${r.age}${under18 ? ' (unter 18)' : ''}`;
  const wa = r.phone ? whatsappNumber(r.phone) : '';
  const waText = encodeURIComponent('Hallo! Hier ist der FC Treptow. Du hattest auf unserer Website ein Probetraining angefragt.');

  const lines = [
    'Neue Anfrage zum Probetraining über die Website.',
    '',
    `Name: ${r.name}`,
    `Alter: ${r.age}${under18 ? ' – unter 18, wir haben nur Herrenmannschaften' : ''}`,
    `E-Mail: ${r.email}`,
    `Telefon: ${r.phone || '–'}`,
    `Bevorzugter Kontaktweg: ${contactWayNames[/** @type {keyof typeof contactWayNames} */ (r.contactWay)]}`,
    `Wunsch-Team: ${team ? team.name : 'kein Wunsch, Team vorschlagen'}`,
    `Sprache der Seite: ${languageNames[/** @type {keyof typeof languageNames} */ (r.lang)]}`,
    '',
    'Kurz zur Person:',
    r.experience || '–',
    '',
    'So antwortest du:',
    '- Per E-Mail: einfach auf diese Mail antworten, die Antwort geht direkt an die Person.',
  ];
  if (wa) {
    lines.push(`- Per WhatsApp: https://wa.me/${wa}?text=${waText}`);
    lines.push(`- Anrufen: +${wa}`);
    lines.push('  Klappt WhatsApp nicht (Nummer nicht bei WhatsApp)? Dann per E-Mail antworten.');
  }
  lines.push(
    '',
    '--',
    'Bitte im Postfach kontakt@ den Stand per Label pflegen (Probetraining/Kontaktiert, Termin, Mitglied, Abgesagt).',
    'Anfragen ohne Mitgliedschaft nach sechs Monaten löschen, auch Kopien im eigenen Postfach.',
  );
  return { subject, text: lines.join('\n') };
}

const confirmTexts = {
  de: {
    subject: 'Deine Anfrage zum Probetraining beim FC Treptow',
    hello: 'Hallo,',
    received: 'danke für deine Anfrage zum Probetraining. Sie ist bei uns angekommen, wir melden uns in den nächsten Tagen mit einem Termin.',
    times: 'Trainingszeiten von {team}:',
    anyTeam: 'Wir schauen gemeinsam, welche Mannschaft zu dir passt.',
    feedback: 'Nach ein paar Einheiten gibt dir der Trainer Rückmeldung, ob es passt.',
    under18: 'Hinweis: Wir haben nur Herrenmannschaften (ab 18 Jahren). Wir melden uns trotzdem bei dir.',
    more: 'Mehr zur Mannschaft und zum Platz:',
    reply: 'Fragen? Antworte einfach auf diese E-Mail.',
    regards: 'Sportliche Grüße\nFC Treptow e.V.',
    footer: 'Diese E-Mail wurde automatisch verschickt, weil auf fc-treptow.de mit dieser Adresse ein Probetraining angefragt wurde. Warst du das nicht? Dann ignoriere sie einfach.',
  },
  en: {
    subject: 'Your trial training request at FC Treptow',
    hello: 'Hi,',
    received: 'thanks for your trial training request. We have received it and will get back to you with a date within the next few days.',
    times: 'Training times of {team}:',
    anyTeam: 'We will figure out together which team suits you.',
    feedback: 'After a few sessions, the coach will let you know whether it’s a fit.',
    under18: 'Please note: we only have men’s teams (18 and over). We will still get back to you.',
    more: 'More about the team and the ground:',
    reply: 'Questions? Just reply to this email.',
    regards: 'Best regards\nFC Treptow e.V.',
    footer: 'This email was sent automatically because a trial training was requested on fc-treptow.de with this address. Wasn’t you? Then simply ignore it.',
  },
  tr: {
    subject: 'FC Treptow deneme antrenmanı isteğin',
    hello: 'Merhaba,',
    received: 'deneme antrenmanı isteğin için teşekkürler. İsteğin bize ulaştı, önümüzdeki günlerde bir tarihle sana dönüş yapacağız.',
    times: '{team} antrenman saatleri:',
    anyTeam: 'Hangi takımın sana uygun olduğuna birlikte bakacağız.',
    feedback: 'Birkaç antrenmandan sonra antrenör uyum olup olmadığını sana bildirecek.',
    under18: 'Not: Sadece erkek takımlarımız var (18 yaş ve üstü). Yine de sana dönüş yapacağız.',
    more: 'Takım ve saha hakkında daha fazlası:',
    reply: 'Sorun mu var? Bu e-postayı yanıtlaman yeterli.',
    regards: 'Sportif selamlar\nFC Treptow e.V.',
    footer: 'Bu e-posta, fc-treptow.de üzerinden bu adresle deneme antrenmanı istendiği için otomatik olarak gönderildi. Sen değil miydin? O zaman dikkate alma.',
  },
  ar: {
    subject: 'طلبك للتدريب التجريبي في نادي إف سي تريبتاو',
    hello: 'مرحبًا،',
    received: 'شكرًا على طلبك للتدريب التجريبي. وصلنا الطلب، وسنتواصل معك خلال الأيام القادمة بموعد.',
    times: 'مواعيد تدريب {team}:',
    anyTeam: 'سنرى معًا أي فريق يناسبك.',
    feedback: 'بعد بضع حصص سيخبرك المدرب ما إذا كان الأمر مناسبًا.',
    under18: 'ملاحظة: لدينا فرق رجال فقط (من 18 عامًا). سنتواصل معك على أي حال.',
    more: 'المزيد عن الفريق والملعب:',
    reply: 'لديك أسئلة؟ فقط رُد على هذه الرسالة.',
    regards: 'مع أطيب التحيات الرياضية\nFC Treptow e.V.',
    footer: 'أُرسلت هذه الرسالة تلقائيًا لأن أحدهم طلب تدريبًا تجريبيًا على fc-treptow.de بهذا العنوان. لم تكن أنت؟ إذن تجاهلها ببساطة.',
  },
  es: {
    subject: 'Tu solicitud de entrenamiento de prueba en el FC Treptow',
    hello: 'Hola:',
    received: 'gracias por tu solicitud de entrenamiento de prueba. La hemos recibido y te contactaremos en los próximos días con una fecha.',
    times: 'Horarios de entrenamiento de {team}:',
    anyTeam: 'Veremos juntos qué equipo encaja contigo.',
    feedback: 'Tras unas cuantas sesiones, el entrenador te dirá si encajas.',
    under18: 'Ten en cuenta que solo tenemos equipos masculinos (a partir de 18 años). Aun así te contactaremos.',
    more: 'Más sobre el equipo y el campo:',
    reply: '¿Preguntas? Responde a este correo.',
    regards: 'Saludos deportivos\nFC Treptow e.V.',
    footer: 'Este correo se envió automáticamente porque alguien solicitó un entrenamiento de prueba en fc-treptow.de con esta dirección. ¿No fuiste tú? Simplemente ignóralo.',
  },
  fr: {
    subject: 'Votre demande de séance d’essai au FC Treptow',
    hello: 'Bonjour,',
    received: 'merci pour votre demande de séance d’essai. Nous l’avons bien reçue et vous recontactons dans les prochains jours avec une date.',
    times: 'Horaires d’entraînement de {team} :',
    anyTeam: 'Nous verrons ensemble quelle équipe vous correspond.',
    feedback: 'Après quelques séances, l’entraîneur vous dira si cela vous convient.',
    under18: 'À noter : nous n’avons que des équipes masculines (18 ans et plus). Nous vous recontacterons quand même.',
    more: 'En savoir plus sur l’équipe et le terrain :',
    reply: 'Des questions ? Répondez simplement à cet e-mail.',
    regards: 'Sportivement\nFC Treptow e.V.',
    footer: 'Cet e-mail a été envoyé automatiquement parce qu’une séance d’essai a été demandée sur fc-treptow.de avec cette adresse. Ce n’était pas vous ? Ignorez-le simplement.',
  },
};

/**
 * Eingangsbestätigung. Enthält bewusst keine Freitexte aus dem Formular (auch nicht den Namen),
 * damit niemand über das Formular eigene Inhalte an fremde Adressen schicken kann.
 * @param {TrialRequest} r
 * @param {FormTeam | undefined} team
 * @param {string} teamSlug
 * @param {string} origin z. B. https://fc-treptow.de
 */
export function confirmMail(r, team, teamSlug, origin) {
  const t = confirmTexts[/** @type {keyof typeof confirmTexts} */ (r.lang)] ?? confirmTexts.de;
  const prefix = r.lang === 'de' ? '' : `/${r.lang}`;
  const lines = [t.hello, '', t.received, ''];
  if (team && team.training.length) {
    lines.push(t.times.replace('{team}', team.name));
    for (const s of team.training) lines.push(`- ${dayName(s.day, r.lang)}, ${s.from}–${s.to}`);
    lines.push('');
  } else if (!team) {
    lines.push(t.anyTeam, '');
  }
  // Die Freizeit Kickers wählen nicht aus, deshalb dort kein Hinweis auf die Rückmeldung des Trainers
  if (teamSlug !== 'freizeit-kickers') lines.push(t.feedback, '');
  if (r.age < 18) lines.push(t.under18, '');
  lines.push(t.more, team ? `${origin}${prefix}/mannschaften/${teamSlug}` : `${origin}${prefix}/mannschaften`, '');
  lines.push(t.reply, '', t.regards, '', '--', t.footer);
  return { subject: t.subject, text: lines.join('\n') };
}
