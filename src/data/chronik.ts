// Daten der Vereinschronik. Sprachneutrales (Wappen) und die
// ausführlichen Texte "Mehr lesen", die es bewusst nur auf Deutsch gibt.
// Kurztexte und Beschriftungen in allen Sprachen stehen in src/i18n/pages.ts (vereinschronik).
// Die Spielzeiten pflegt die Redaktion im CMS (src/content/chronik/spielzeiten.yml).

export type EraId = 'werksverein' | 'turbine' | 'fusion' | 'landesliga' | 'heute';

export interface Wappen {
  jahr: string;
  name: string;
  bild: string;
  epoche: EraId;
}

// Reihenfolge = Wappenleiste oben auf der Seite.
export const wappen: Wappen[] = [
  { jahr: '1925', name: 'Werksverein Bewag', bild: '/images/chronik-1925.jpg', epoche: 'werksverein' },
  { jahr: '1932', name: 'SV Bewag Berlin', bild: '/images/chronik-1932.webp', epoche: 'werksverein' },
  { jahr: '1938', name: 'SV Elektra Berlin', bild: '/images/chronik-1938.png', epoche: 'werksverein' },
  { jahr: '1950', name: 'BSG Turbine Bewag', bild: '/images/chronik-1950.jpg', epoche: 'turbine' },
  { jahr: '1978', name: 'BSG Turbine Berlin', bild: '/images/chronik-1978.webp', epoche: 'turbine' },
  { jahr: '1984', name: 'BSG Turbine EKB Treptow', bild: '/images/chronik-1984.jpg', epoche: 'turbine' },
  { jahr: '1990', name: 'SV Turbine Berlin', bild: '/images/chronik-1990.webp', epoche: 'fusion' },
  { jahr: '1994', name: 'ESV Lok Schöneweide', bild: '/images/chronik-lok.png', epoche: 'fusion' },
  { jahr: '1994', name: 'FC Treptow e.V.', bild: '/images/crest.png', epoche: 'fusion' },
];

// Ausführliche Fassung je Epoche, ein Eintrag pro Absatz. Nur Deutsch.
export const mehr: Record<EraId, string[]> = {
  werksverein: [
    '1932 wird aus dem Werksverein der SV Bewag Berlin. Im selben Jahr gelingt der Sprung in die Oberliga Berlin-Brandenburg, Staffel B. Mit den großen Namen wie Hertha BSC oder Blau-Weiß 90 kann der Betriebsverein aber nicht dauerhaft mithalten.',
    '1936 steigt Bewag gemeinsam mit dem SC Union Oberschöneweide in die Gauliga auf, die gleichzeitig auf zwölf Mannschaften verkleinert wird. Zwei Jahre später heißt der Verein SV Elektra Berlin und nimmt am Tschammer-Pokal teil, dem Vorläufer des DFB-Pokals.',
    'Nach Plätzen im Mittelfeld folgt 1941 als Elfter der Abstieg. Bis Kriegsende ruht der Spielbetrieb.',
  ],
  turbine: [
    '1945 lösen die Alliierten die deutschen Sportvereine auf; gekickt wird zunächst in der Sportgruppe Baumschulenweg. 1949 folgt die Neugründung als BSG Bewag Berlin, die gleich im ersten FDGB-Pokal antritt. Ein Jahr später beginnt mit dem Namen BSG Turbine Bewag die Turbine-Ära.',
    'In den höheren DDR-Ligen setzt sich der Betriebsverein nie fest. Am längsten hält er sich in der Bezirksliga, von 1959 bis 1966, danach pendelt er zwischen Bezirksklasse und Bezirksliga.',
    '1978 wird daraus die BSG Turbine Berlin, 1984 die BSG Turbine EKB Treptow.',
  ],
  fusion: [
    '1990 wird aus der Betriebssportgemeinschaft der SV Turbine Berlin. 1994 löst sich die Fußballabteilung vom Hauptverein und fusioniert mit der Fußballabteilung des ESV Lok Schöneweide. Der neue Verein trägt den Namen seines Bezirks.',
    'Der Start gelingt: In der ersten Saison 1994/95 wird der FC Treptow Vierter der Kreisliga B, ein Jahr später Dritter mit 104 Toren aus 30 Spielen.',
  ],
  landesliga: [
    'Mit dem Beitritt von NARVA springt der Verein von der Kreisliga B direkt in die Landesliga Berlin. 1996/97 und 1999/2000 reicht es jeweils zu Platz vier.',
    '2001 folgt der Abstieg in die Bezirksliga, 2005 der nächste Schritt nach unten.',
  ],
  heute: [],
};

// Spielklassen für die Ligaleiter, von unten nach oben (Stufe 1 bis 4). Die Stufe einer Saison
// ergibt sich aus dem Anfang des Liga-Namens in den Spielzeiten (CMS: Vereinschronik › Spielzeiten).
export const ligaStufen = ['Kreisliga B', 'Kreisliga A', 'Bezirksliga', 'Landesliga'];

export interface Spielzeit { saison: string; verein: string; liga: string; tore: string; punkte: string; platz: string }

// Startjahr einer Saison: "2026/27" -> 2026, "1960" -> 1960
export const startJahr = (saison: string) => Number(saison.slice(0, 4));

// Stufe der Ligaleiter aus dem Liga-Namen, null = keine der vier Spielklassen
export const stufeVon = (liga: string): 1 | 2 | 3 | 4 | null => {
  const i = ligaStufen.findIndex((s) => liga.startsWith(s));
  return i < 0 ? null : ((i + 1) as 1 | 2 | 3 | 4);
};

// Ligaleiter der 1. Herren seit 1994/95: eine Spalte pro Saison bis zur neuesten eingetragenen,
// Lücken ohne Eintrag als "keine Daten". Kurzform "94/95" für die Achse.
export function ligaleiterAus(spielzeiten: Spielzeit[]) {
  const nachJahr = new Map(spielzeiten.filter((s) => s.verein === 'FC Treptow').map((s) => [startJahr(s.saison), s]));
  const letztes = Math.max(...nachJahr.keys());
  const leiter: { saison: string; jahr: number; stufe: 1 | 2 | 3 | 4 | null }[] = [];
  for (let j = 1994; j <= letztes; j++) {
    const s = nachJahr.get(j);
    leiter.push({ saison: `${String(j % 100).padStart(2, '0')}/${String((j + 1) % 100).padStart(2, '0')}`, jahr: j, stufe: s ? stufeVon(s.liga) : null });
  }
  return leiter;
}

export const quellen = [
  { label: 'Deutsches Fußball-Archiv (CC BY-SA)', href: 'https://daffs.fandom.com/wiki/FC_Treptow' },
  { label: 'FuPa', href: 'https://www.fupa.net/team/fc-treptow-m1-2026-27/history' },
];
