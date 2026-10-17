# FC Treptow e.V. – Webseite

Neubau von fc-treptow.de als statische Astro-Seite. Sechs Sprachen (Deutsch als Standard, Englisch,
Türkisch, Arabisch, Spanisch, Französisch), gepflegt wird nur Deutsch. Spielplan und Tabellen kommen
automatisch von fussball.de. Kein Tracking, keine Cookies, keine Fremdskripte auf den öffentlichen Seiten.

## Umgebungen

| Was | Adresse |
|---|---|
| Live-Seite | https://fct-website-refresh.vercel.app |
| Redaktion (CMS) | https://fct-website-refresh.vercel.app/admin |
| Vorschau je Pull Request | Vercel kommentiert den Link automatisch im Pull Request |
| Quellcode | https://github.com/fc-treptow/website-refresh |
| Lokal | http://localhost:4321 (Redaktion lokal: http://localhost:4321/admin/index.html) |

Das Vercel-Projekt und das GitHub-Repository gehören vollständig der Vereinsorganisation `fc-treptow`.
Jeder Push auf `main` (auch aus dem CMS) geht nach etwa zwei Minuten live.

Die ältere Adresse **fc-treptow-site.vercel.app** war die Version aus dem früheren GitHub-Repository.
Sie ist nicht mehr maßgeblich, wird aus diesem Repository nicht mehr aktualisiert und sollte gelöscht
oder auf die neue Adresse umgeleitet werden.

## Für die Redaktion (ohne Technik)

Die Inhalte werden unter **https://fct-website-refresh.vercel.app/admin** gepflegt. Anmeldung mit E-Mail
und Passwort. Was gespeichert wird, ist nach etwa zwei Minuten online.

Dort gibt es diese Bereiche:

| Bereich | Was man dort macht |
|---|---|
| Neuigkeiten | Beiträge schreiben, mit Foto. Erscheinen auf der Startseite und unter News. |
| Mannschaften | Trainingszeiten, Trainer, Mannschaftsfotos ändern. |
| Vorstand | Namen, Ämter und Kontaktdaten. |
| Partner und Sponsoren | Logo, Name, Link. |
| Fanshop-Artikel | Auswahl für die Fanshop-Seite (Name, Preis, Foto, Link in den Shop). |
| Downloads (PDF) | Formulare und Ordnungen hochladen oder austauschen. |
| In Gedenken | Nachrufe. |
| Einstellungen | Link zum Mitgliedsantrag in easyVerein (Seite Mitgliedschaft). Nur ändern, wenn sich die Adresse ändert. |

Faustregeln:

- Immer auf **Veröffentlichen** klicken, sonst bleibt es ein Entwurf.
- Fotos im Querformat, nicht größer als etwa 2 MB.
- Nur auf Deutsch schreiben. Die anderen Sprachen zeigen automatisch den deutschen Text, bis jemand
  eine Übersetzung nachträgt (dafür ist Technik nötig, siehe unten).
- Spielplan und Tabelle muss niemand pflegen. Sie kommen von fussball.de.

## Redaktion einrichten (einmalig, technisch)

Die Redaktion ist Decap CMS. Damit sich die Redaktion **ohne GitHub-Konto** anmelden kann, läuft die
Anmeldung über [DecapBridge](https://decapbridge.com) (kostenlos bis 10 Personen):

1. Erledigt (25.09.2026): Seite "FC Treptow" bei DecapBridge, PKCE-Login, Werte stehen in
   `public/admin/config.yml`. Der GitHub-Token, mit dem DecapBridge ins Repository schreibt, ist
   **bei DecapBridge hinterlegt, nicht im Repository** (nie in `config.yml` eintragen, das Repository
   ist öffentlich). Er läuft ab und muss dann erneuert und bei DecapBridge ersetzt werden
   (github.com/settings/tokens, Fine-grained, nur `fc-treptow`, Contents + Pull requests Read/Write).
2. Erledigt: Redaktion per E-Mail in DecapBridge eingeladen. Neue Mitglieder dort einladen; sie
   bekommen einen Link und setzen ein Passwort.
3. Erledigt: Vercel-Projekt `fct-website-refresh` ist mit diesem GitHub-Repository verbunden und baut
   nach jeder Änderung (auch aus dem CMS) automatisch neu.

Lokal testen: `npx decap-server` in einem zweiten Terminal, dann http://localhost:4321/admin/index.html
öffnen (nutzt `local_backend: true`, keine Anmeldung nötig).

## Lokal starten

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # holt dabei Spielplan und Tabellen von fussball.de
```

`SKIP_FIXTURES=1 npm run build` baut ohne fussball.de (offline). `npm run check` prüft Typen und
fehlende Übersetzungsschlüssel. Beides läuft automatisch in GitHub Actions bei jedem Pull Request und
jedem Push auf `main` (`.github/workflows/check.yml`).

Regeln für KI-Assistenten (Claude & Co.) stehen in `AGENTS.md` (`CLAUDE.md` ist ein Link darauf).

## Wie die Seite aufgebaut ist

- `src/content/` – alle redaktionellen Inhalte als Markdown (das, was das CMS schreibt).
  - `news/de`, `teams/de` sind die Quelle. `news/en` usw. sind freiwillige Übersetzungen
    mit demselben Dateinamen. Fehlt eine, wird Deutsch gezeigt.
- `src/i18n/` – alle festen Oberflächentexte in sechs Sprachen. `ui.ts` (Navigation, Startseite),
  `pages.ts` (Unterseiten), `fixtures.ts` (Spielplan/Tabelle). Deutsch ist die Typvorlage: fehlt in
  einer Sprache ein Schlüssel, meldet `npm run check` einen Fehler (der Build allein prüft das nicht).
- `src/data/club.ts` – Stammdaten (Adresse, E-Mails, Telefon, Beiträge, IBAN, Social Links).
- `src/legal/datenschutz.md` – Datenschutzerklärung (Deutsch, rechtlich bindend).
- `src/lib/fussballde.mjs` – liest nächste Spiele und Tabelle von fussball.de (kein Widget, kein
  Fremdskript im Browser). Läuft beim Build und in `api/fixtures.mjs` (Vercel-Funktion, eine
  Stunde gecacht), damit die Seite auch ohne neuen Build aktuell bleibt.
- `src/styles/global.css` – Gestaltungsregeln stehen oben in der Datei.

### Gestaltung

Ein Akzent (Vereinsrot), nur für Handlungen. Haarlinien statt Karten. Big Shoulders für Überschriften
und Zahlen, Archivo für Text, Source Serif nur für die Chronik, IBM Plex Sans Arabic für Arabisch.
Auf dem Handy eine untere Leiste mit fünf Zielen, "Mehr" öffnet ein Bottom Sheet mit allem anderen und
der Sprachwahl.

## Formulare

Probetraining und Anmeldung öffnen das E-Mail-Programm mit fertiger Nachricht an
kontakt@fc-treptow.de. Es fließen keine Daten über einen Server. Wer lieber einen Formulardienst
will, setzt `PUBLIC_FORM_ENDPOINT` (dann ist ein AV-Vertrag mit dem Anbieter nötig).

Freischalt-Code für die Anmeldung: `TREPTOW1925`, änderbar in
`src/components/sections/AnmeldungSections.astro`.

## Fanshop

Der Shop läuft bei Spreadshirt (fc-treptow-fanshop.myspreadshop.de) und ist auf /shop **eingebettet**
(Spreadshop-Plugin), inklusive Artikelansicht, Warenkorb und Kasse. Aus Datenschutzgründen lädt er
erst nach einem Klick ("Shop hier öffnen"); vorher geht keine Anfrage an Spreadshirt. Die
Artikelkarten auf Start- und Shopseite sind eine von Hand gepflegte Auswahl (CMS: Fanshop-Artikel)
und öffnen den jeweiligen Artikel im eingebetteten Shop.

## Instagram (optional)

Ohne Zugangsdaten zeigt die Startseite keinen Instagram-Bereich, nur den Link im Footer. Einrichtung
in `src/lib/instagram.ts`. Bilder werden beim Build heruntergeladen und selbst ausgeliefert.

## Offene Punkte vor dem Livegang

1. Datenschutzerklärung vom Vorstand prüfen lassen. Offene Annahmen sind unten in der Datei
   `src/legal/datenschutz.md` nicht markiert, deshalb hier: kein Datenschutzbeauftragter benannt;
   AV-Vertrag mit Vercel muss im Vercel-Konto akzeptiert sein; E-Mail-Anbieter ist als
   Auftragsverarbeiter beschrieben; Löschfristen (Probetraining 6 Monate) müssen gelebt werden.
2. Alte Adresse fc-treptow-site.vercel.app löschen oder auf die neue umleiten (siehe Umgebungen).
3. `SITE_URL` in Vercel setzen, sobald die eigene Domain (fc-treptow.de) umzieht. Bis dahin gilt
   https://fct-website-refresh.vercel.app (Vorgabe in `astro.config.mjs`).

Laufend:

- Fanshop-Auswahl (Preise, Artikel) alle paar Monate mit dem Shop abgleichen (Stand September 2026).

Erledigt:

- Redaktion bei DecapBridge eingeladen.
- Vercel mit dem GitHub-Repository verbunden.
- Instagram: offizielles Konto ist **@fc.treptow** (https://www.instagram.com/fc.treptow/), so in
  `src/data/club.ts` hinterlegt. @fctreptow ist nicht das Vereinskonto.
- Die drei News-Beiträge der alten Seite (Vorstandswahl 2025, Gedenkturnier 2025, 30 Jahre 2024)
  sind übernommen. Neue Beiträge kommen über das CMS.

## Bekannte Einschränkungen

- Der Freischalt-Code der Anmeldung steht im Browser-Code. Er hält Neugierige ab, ist aber keine
  echte Zugangssperre.
- Ergebnisse vergangener Spiele werden nicht gezeigt: fussball.de verschleiert Tore mit einer
  Spezialschrift. Der Link "Alles auf fussball.de" führt hin.
- Kein Dark Mode, bewusst.
