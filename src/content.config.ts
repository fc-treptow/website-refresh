import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import type { ZodTypeAny } from 'astro/zod';

// Grundsatz: Gepflegt wird auf Deutsch. Übersetzungen sind freiwillig. Fehlt eine, zeigt die
// Seite in der jeweiligen Sprache einfach den deutschen Eintrag. So reicht es, im CMS nur
// Deutsch auszufüllen.

// Leere Listen im CMS werden als "null" gespeichert. nullish + transform fängt das ab.
const list = <T extends ZodTypeAny>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((v) => v ?? []);

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    teaser: z.string(),
    image: z.string().optional(),
    tag: z.string().default('Verein'),
  }),
});

export const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;
// Gleiche Regel wie im CMS (public/admin/config.yml): Stunden 0–23, Minuten 00–59.
// Der Punkt als Trenner (19.30) bleibt für ältere Einträge erlaubt.
const time = z.string().regex(/^([01]?\d|2[0-3])[:.][0-5]\d$/, 'Uhrzeit bitte als 19:30 eintragen.');

// Mannschaften: alle Angaben stehen in der deutschen Datei (src/content/teams/de).
const teams = defineCollection({
  loader: glob({ pattern: 'de/*.md', base: './src/content/teams' }),
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    // z. B. "Kreisliga B, Staffel 5". Wird für andere Sprachen automatisch übersetzt.
    league: z.string(),
    order: z.number(),
    training: list(z.object({ day: z.enum(weekdays), from: time, to: time })),
    ground: z.string().default('Willi-Sänger-Sportanlage, Köpenicker Landstraße 186, 12437 Berlin'),
    contact: z.string().default('kontakt@fc-treptow.de'),
    image: z.string(),
    // Bildausschnitt: 0 = oberer Bildrand, 100 = unterer Bildrand
    imageFocus: z.number().min(0).max(100).default(50),
    gallery: list(z.object({ src: z.string(), alt: z.string() })),
    // Spielplan und Tabelle kommen automatisch von fussball.de (src/lib/fussballde.mjs).
    // Nötig ist nur die Team-ID aus der Adresse der Mannschaft auf fussball.de.
    fussballDeTeamId: z
      .string()
      .regex(/^[0-9A-Z]{32}$/, 'Die Team-ID hat 32 Zeichen (Ziffern und Großbuchstaben).')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    staff: list(z.object({ name: z.string(), role: z.enum(['coach', 'assistant', 'manager']), phone: z.string().nullish() })),
  }),
});

// Freiwillige Übersetzungen der Mannschaftstexte: nur Kurzname und Beschreibung.
const teamsI18n = defineCollection({
  loader: glob({ pattern: '{en,tr,ar,es,fr}/*.md', base: './src/content/teams' }),
  schema: z.object({
    shortName: z.string().optional(),
    galleryAlt: z.array(z.string()).optional(),
  }),
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sponsors' }),
  schema: z.object({
    name: z.string(),
    logo: z.string().nullish(),
    url: z.string().nullish(),
    tier: z.enum(['Hauptsponsor', 'Partner']).default('Partner'),
    order: z.number().default(99),
  }),
});

export const boardRoles = ['chair', 'viceChair', 'treasurer', 'refereeLead', 'assessor', 'controlBoard', 'other'] as const;

const vorstand = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vorstand' }),
  schema: z.object({
    name: z.string(),
    role: z.enum(boardRoles),
    // Nur für Rolle "Sonstiges": eigene Bezeichnung
    roleLabel: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    order: z.number().default(99),
  }),
});

// Schiedsrichterinnen und Schiedsrichter des Vereins (Seite /schiedsrichter).
// Der Obmann kommt aus dem Vorstand (Rolle refereeLead), hier steht nur das Team.
const schiedsrichter = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/schiedsrichter' }),
  schema: z.object({
    name: z.string(),
    order: z.number().default(99),
  }),
});

const gedenken = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gedenken' }),
  schema: z.object({
    name: z.string(),
    born: z.coerce.date().nullish(),
    died: z.coerce.date(),
    image: z.string().nullish(),
    signature: z.string().default('Der Vorstand des FC Treptow e. V.'),
  }),
});

const shop = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shop' }),
  schema: z.object({
    name: z.string(),
    price: z.coerce.number(),
    url: z.url(),
    image: z.string(),
    // Weitere Ansichten (Rückseite, Detail), freiwillig
    gallery: list(z.string()),
    productType: z.string().nullish(),
    sizes: z.string().nullish(),
    colours: list(z.string()),
    order: z.number().default(99),
  }),
});

export const downloadGroups = ['Neue Mitglieder', 'Spielberechtigung', 'Vereinsordnungen'] as const;

const downloads = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/downloads' }),
  schema: z.object({
    title: z.string(),
    description: z.string().nullish(),
    file: z.string(),
    group: z.enum(downloadGroups),
    order: z.number().default(99),
  }),
});

export const collections = { news, teams, teamsI18n, sponsors, vorstand, schiedsrichter, gedenken, shop, downloads };
