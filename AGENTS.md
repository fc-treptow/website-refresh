# FC Treptow – Webseite (Hinweise für Claude und andere KI-Assistenten)

`CLAUDE.md` ist ein Link auf diese Datei.

Statische Astro-Seite für den FC Treptow e.V., gehostet auf Vercel, Inhalte über Decap CMS
(Anmeldung via DecapBridge). Die README.md erklärt Redaktion, Einrichtung und offene Punkte;
diese Datei sind die Regeln, die beim Ändern von Code und Inhalten gelten.

## Prüfen, bevor etwas fertig ist

```bash
npm ci
npm run check                    # Typprüfung, muss 0 errors melden
SKIP_FIXTURES=1 npm run build    # baut ohne fussball.de (offline, schnell)
```

Beides läuft auch in GitHub Actions bei jedem Pull Request (`.github/workflows/check.yml`).
`npm run build` ohne `SKIP_FIXTURES` fragt fussball.de ab; nur verwenden, wenn es um Spielplan
oder Tabelle geht.

Dev-Server im Hintergrund starten: `astro dev --background` (beenden mit `astro dev stop`,
Status mit `astro dev status`, Logs mit `astro dev logs`).

## Inhalte und Sprachen

- Sechs Sprachen: Deutsch (Standard, ohne Präfix), `en`, `tr`, `ar`, `es`, `fr`. Arabisch ist RTL.
- Quelle ist immer Deutsch. `src/content/news/de` und `src/content/teams/de` pflegt die
  Redaktion im CMS. Übersetzungen liegen unter `news/<lang>/` bzw. `teams/<lang>/` mit
  **demselben Dateinamen**; fehlt eine, wird Deutsch gezeigt. Deutsche Inhalte nicht ohne
  ausdrücklichen Auftrag umschreiben, sie gehören der Redaktion.
- Diese Übersetzungen erzeugt der Workflow `.github/workflows/translate.yml` mit GitHub
  Models (`scripts/translate-content.mjs`). Der Schlüssel `quelle` im Frontmatter hält pro Feld den
  Fingerabdruck des deutschen Textes; nach einer Übersetzung von Hand
  `node scripts/translate-content.mjs --fingerprints-only` laufen lassen, damit sie als aktuell gilt.
- Feste Oberflächentexte stehen in `src/i18n/` (`ui.ts`, `pages.ts`, `fixtures.ts`). Deutsch ist
  die Typvorlage: Jeder neue Schlüssel muss in **allen sechs Sprachen** angelegt werden, sonst
  schlägt `npm run check` fehl (der Build allein prüft keine Typen).
- Die Seiten unter `src/pages/<lang>/` sind dünne Hüllen um `src/components/sections/*Sections.astro`.
  Eine neue Seite braucht deshalb: Section-Komponente, Texte in `pages.ts`, eine Hülle pro Sprache
  und einen Eintrag in Navigation bzw. "Mehr"-Sheet, falls sie dort erscheinen soll.
- Neue Inhaltsfelder immer in `src/content.config.ts` (Schema) **und** `public/admin/config.yml`
  (CMS-Felder) eintragen, sonst kann die Redaktion sie nicht pflegen oder der Build bricht bei
  CMS-Einträgen.
- Stammdaten (Adresse, E-Mails, Beiträge, IBAN, Social Links) nur in `src/data/club.ts`.
- `src/legal/datenschutz.md` ist rechtlich bindend. Nur auf ausdrücklichen Auftrag ändern, und
  jede Änderung, die neue Datenflüsse einführt, dort nachtragen.

## Datenschutz ist eine Designvorgabe

- Keine Tracker, keine Cookies, keine Fremdskripte und keine Fremd-Fonts auf öffentlichen Seiten.
  Schriften kommen über `@fontsource`, Bilder werden selbst ausgeliefert.
- Externe Dienste (Spreadshop-Fanshop) laden erst nach einem Klick. Dieses Muster beibehalten.
- fussball.de wird nur serverseitig gelesen: beim Build (`src/lib/fixturesBuild.ts`) und in der
  Vercel-Funktion `api/fixtures.mjs`. Nie ein fussball.de-Widget oder -Skript im Browser einbauen.
- Formulare öffnen das E-Mail-Programm (mailto); es gibt keinen eigenen Server für Formulardaten.

## Gestaltung

Die Regeln stehen oben in `src/styles/global.css` und gelten verbindlich:

- Ein Akzent, Vereinsrot (`--color-club`), nur für Handlungen, aktive Zustände und das rote Band
  "Mitspielen". Keine anderen roten Flächen.
- Handlungen sind Pillen (`rounded-full`), Flächen 4px (`rounded-sm`).
- Haarlinien (`--color-line`) statt Karten.
- Big Shoulders für Überschriften und Zahlen, Archivo für Text, Source Serif nur in der Chronik,
  IBM Plex Sans Arabic für Arabisch.
- Kein Dark Mode, bewusst.
- Auf dem Handy: untere Leiste mit fünf Zielen, "Mehr" öffnet das Bottom Sheet.

## Sonstiges

- `api/_teams.mjs` wird von `scripts/gen-teams.mjs` erzeugt (läuft vor `dev` und `build`). Nicht
  von Hand ändern.
- Commits vom CMS haben die Form `Create/Update/Delete … via DecapBridge`. Nicht umschreiben oder
  squashen, sie dokumentieren, wer was geändert hat.
- Keine Zugangsdaten ins Repository. Der GitHub-Token für DecapBridge liegt bei DecapBridge, nicht
  in `public/admin/config.yml`.
- Code-Kommentare und Commit-Nachrichten auf Deutsch, wie im Rest des Projekts.

## Astro-Dokumentation

https://docs.astro.build – vor Arbeiten an Routing, Content Collections, i18n oder Styling die
passende Anleitung lesen.
