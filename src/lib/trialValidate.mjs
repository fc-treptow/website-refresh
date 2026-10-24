// @ts-check
// Prüfregeln für das Probetraining-Formular. Der Browser prüft dieselben Regeln über
// HTML-Attribute (required, maxlength, type=email …); hier prüft der Server noch einmal,
// weil Bots den Browser umgehen. Genutzt von api/probetraining.mjs.

export const locales = ['de', 'en', 'tr', 'ar', 'es', 'fr'];
export const contactWays = ['email', 'phone', 'whatsapp'];
export const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const limits = { name: 80, email: 120, phone: 20, experience: 1000 };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[0-9 ()/-]{6,20}$/;
const linkPattern = /(https?:\/\/|www\.|\[url|<a\s)/i;
const lineBreak = /[\r\n]/;

/** @param {unknown} v */
const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * @typedef {{ name: string, age: number, email: string, phone: string, contactWay: string,
 *   team: string, days: string[], experience: string, lang: string }} TrialRequest
 */

/**
 * Prüft die Eingaben. Gibt entweder die bereinigten Daten oder das erste fehlerhafte Feld zurück.
 * @param {Record<string, unknown>} body
 * @param {Record<string, unknown>} teams erlaubte Mannschaften (Slug als Schlüssel)
 * @returns {{ ok: true, data: TrialRequest } | { ok: false, field: string }}
 */
export function validateTrial(body, teams) {
  const name = str(body.name);
  if (name.length < 2 || name.length > limits.name || lineBreak.test(name) || linkPattern.test(name)) return { ok: false, field: 'name' };

  const age = Number(body.age);
  if (!Number.isInteger(age) || age < 1 || age > 99) return { ok: false, field: 'age' };

  const email = str(body.email).toLowerCase();
  if (email.length > limits.email || !emailPattern.test(email) || lineBreak.test(email)) return { ok: false, field: 'email' };

  const contactWay = contactWays.includes(str(body.contactWay)) ? str(body.contactWay) : '';
  if (!contactWay) return { ok: false, field: 'contactWay' };

  const phone = str(body.phone);
  if (phone && !phonePattern.test(phone)) return { ok: false, field: 'phone' };
  if (contactWay !== 'email' && !phone) return { ok: false, field: 'phone' };

  const team = str(body.team);
  if (team && !Object.hasOwn(teams, team)) return { ok: false, field: 'team' };

  const days = Array.isArray(body.days) ? body.days.filter((d) => weekdays.includes(d)) : [];

  const experience = str(body.experience);
  if (experience.length > limits.experience || linkPattern.test(experience)) return { ok: false, field: 'experience' };

  if (body.privacy !== true) return { ok: false, field: 'privacy' };

  const lang = locales.includes(str(body.lang)) ? str(body.lang) : 'de';

  return { ok: true, data: { name, age, email, phone, contactWay, team, days: [...new Set(days)], experience, lang } };
}

/**
 * Telefonnummer für einen wa.me-Link: nur Ziffern, mit Ländervorwahl (deutsche Nummern ohne
 * Vorwahl bekommen 49).
 * @param {string} phone
 */
export function whatsappNumber(phone) {
  let digits = phone.replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `49${digits.slice(1)}`;
  return digits.replace(/\D/g, '');
}
