// Daten der Vereinschronik. Sprachneutrales (Wappen, Spielzeiten, Ligaleiter) und die
// ausführlichen Texte "Mehr lesen", die es bewusst nur auf Deutsch gibt.
// Kurztexte und Beschriftungen in allen Sprachen stehen in src/i18n/pages.ts (vereinschronik).

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

// Spielklasse der 1. Herren seit 1994 für die Ligaleiter. 4 = Landesliga, 3 = Bezirksliga,
// 2 = Kreisliga A, 1 = Kreisliga B, null = keine Daten. Jede neue Saison hinten anhängen.
export const ligaleiter: { saison: string; stufe: 1 | 2 | 3 | 4 | null }[] = [
  { saison: '94/95', stufe: 1 }, { saison: '95/96', stufe: 1 },
  { saison: '96/97', stufe: 4 }, { saison: '97/98', stufe: 4 }, { saison: '98/99', stufe: 4 },
  { saison: '99/00', stufe: 4 }, { saison: '00/01', stufe: 4 },
  { saison: '01/02', stufe: 3 }, { saison: '02/03', stufe: 3 }, { saison: '03/04', stufe: 3 },
  { saison: '04/05', stufe: 3 },
  { saison: '05/06', stufe: null }, { saison: '06/07', stufe: null }, { saison: '07/08', stufe: null },
  { saison: '08/09', stufe: null }, { saison: '09/10', stufe: null },
  { saison: '10/11', stufe: 2 }, { saison: '11/12', stufe: 2 }, { saison: '12/13', stufe: 2 },
  { saison: '13/14', stufe: 2 }, { saison: '14/15', stufe: 2 }, { saison: '15/16', stufe: 2 },
  { saison: '16/17', stufe: 2 }, { saison: '17/18', stufe: 2 }, { saison: '18/19', stufe: 2 },
  { saison: '19/20', stufe: 2 }, { saison: '20/21', stufe: 2 }, { saison: '21/22', stufe: 2 },
  { saison: '22/23', stufe: 2 }, { saison: '23/24', stufe: 2 }, { saison: '24/25', stufe: 2 },
  { saison: '25/26', stufe: 1 }, { saison: '26/27', stufe: 1 },
];
export const ligaStufen = ['Kreisliga B', 'Kreisliga A', 'Bezirksliga', 'Landesliga'];

// Alle bekannten Spielzeiten, neueste zuerst. Punkte bis 1994/95 nach Zwei-Punkte-Regel.
// "–" = in den Quellen nicht angegeben. Platz in Klammern = Zahl der Mannschaften.
export const spielzeiten: { saison: string; verein: string; liga: string; tore: string; punkte: string; platz: string }[] = [
  { saison: '2026/27', verein: 'FC Treptow', liga: 'Kreisliga B, St. 5', tore: '–', punkte: '–', platz: '10. (läuft)' },
  { saison: '2025/26', verein: 'FC Treptow', liga: 'Kreisliga B, St. 2', tore: '–', punkte: '–', platz: '9.' },
  { saison: '2024/25', verein: 'FC Treptow', liga: 'Kreisliga A, St. 2', tore: '–', punkte: '–', platz: '15.' },
  { saison: '2023/24', verein: 'FC Treptow', liga: 'Kreisliga A, St. 4', tore: '–', punkte: '–', platz: '11.' },
  { saison: '2022/23', verein: 'FC Treptow', liga: 'Kreisliga A, St. 3', tore: '–', punkte: '–', platz: '10.' },
  { saison: '2021/22', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '11.' },
  { saison: '2020/21', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '2.' },
  { saison: '2019/20', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '9.' },
  { saison: '2018/19', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '5.' },
  { saison: '2017/18', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '9.' },
  { saison: '2016/17', verein: 'FC Treptow', liga: 'Kreisliga A, St. 4', tore: '73:96', punkte: '37', platz: '10. (16)' },
  { saison: '2015/16', verein: 'FC Treptow', liga: 'Kreisliga A, St. 2', tore: '–', punkte: '–', platz: '7.' },
  { saison: '2014/15', verein: 'FC Treptow', liga: 'Kreisliga A, St. 1', tore: '–', punkte: '–', platz: '6.' },
  { saison: '2013/14', verein: 'FC Treptow', liga: 'Kreisliga A, St. 3', tore: '–', punkte: '–', platz: '7.' },
  { saison: '2012/13', verein: 'FC Treptow', liga: 'Kreisliga A, St. 4', tore: '–', punkte: '–', platz: '10.' },
  { saison: '2011/12', verein: 'FC Treptow', liga: 'Kreisliga A, St. 3', tore: '51:76', punkte: '35', platz: '13. (16)' },
  { saison: '2010/11', verein: 'FC Treptow', liga: 'Kreisliga A, St. 4', tore: '62:71', punkte: '42', platz: '11. (17)' },
  { saison: '2004/05', verein: 'FC Treptow', liga: 'Bezirksliga, St. 1', tore: '34:94', punkte: '15', platz: '15. (16)' },
  { saison: '2003/04', verein: 'FC Treptow', liga: 'Bezirksliga, St. 2', tore: '59:36', punkte: '44', platz: '5. (16)' },
  { saison: '2002/03', verein: 'FC Treptow', liga: 'Bezirksliga, St. 2', tore: '53:59', punkte: '35', platz: '12. (16)' },
  { saison: '2001/02', verein: 'FC Treptow', liga: 'Bezirksliga, St. 3', tore: '53:65', punkte: '41', platz: '7. (16)' },
  { saison: '2000/01', verein: 'FC Treptow', liga: 'Landesliga, St. 1', tore: '47:68', punkte: '24', platz: '15. (16)' },
  { saison: '1999/00', verein: 'FC Treptow', liga: 'Landesliga, St. 2', tore: '68:61', punkte: '46', platz: '4. (16)' },
  { saison: '1998/99', verein: 'FC Treptow', liga: 'Landesliga, St. 2', tore: '61:66', punkte: '35', platz: '9. (16)' },
  { saison: '1997/98', verein: 'FC Treptow', liga: 'Landesliga, St. 2', tore: '50:52', punkte: '38', platz: '8. (16)' },
  { saison: '1996/97', verein: 'FC Treptow', liga: 'Landesliga, St. 2', tore: '66:46', punkte: '50', platz: '4. (16)' },
  { saison: '1995/96', verein: 'FC Treptow', liga: 'Kreisliga B, St. 3', tore: '104:41', punkte: '65', platz: '3. (16)' },
  { saison: '1994/95', verein: 'FC Treptow', liga: 'Kreisliga B, St. 2', tore: '83:32', punkte: '41:19', platz: '4. (16)' },
  { saison: '1960', verein: 'BSG Turbine Bewag', liga: 'Bezirksliga Berlin-Ost', tore: '27:25', punkte: '22:22', platz: '7. (12)' },
  { saison: '1959', verein: 'BSG Turbine Bewag', liga: 'Bezirksliga Berlin-Ost', tore: '28:30', punkte: '17:23', platz: '5. (11)' },
  { saison: '1956', verein: 'BSG Turbine Bewag', liga: 'Bezirksliga Berlin-Ost B', tore: '20:50', punkte: '8:36', platz: '11. (12)' },
  { saison: '1940/41', verein: 'SV Elektra Berlin', liga: 'Gauliga Berlin-Brandenburg', tore: '38:51', punkte: '17:27', platz: '11. (12)' },
  { saison: '1939/40', verein: 'SV Elektra Berlin', liga: 'Gauliga, Staffel A', tore: '19:23', punkte: '11:9', platz: '3. (6)' },
  { saison: '1938/39', verein: 'SV Elektra Berlin', liga: 'Gauliga Berlin-Brandenburg', tore: '21:25', punkte: '14:22', platz: '7. (10)' },
  { saison: '1937/38', verein: 'SV Bewag Berlin', liga: 'Gauliga Berlin-Brandenburg', tore: '32:35', punkte: '16:20', platz: '5. (10)' },
  { saison: '1936/37', verein: 'SV Bewag Berlin', liga: 'Gauliga Berlin-Brandenburg', tore: '33:31', punkte: '16:20', platz: '6. (10)' },
  { saison: '1932/33', verein: 'SV Bewag Berlin', liga: 'Verbandsliga, Gruppe B', tore: '39:52', punkte: '13:23', platz: '9. (10)' },
];

export const quellen = [
  { label: 'Deutsches Fußball-Archiv (CC BY-SA)', href: 'https://daffs.fandom.com/wiki/FC_Treptow' },
  { label: 'FuPa', href: 'https://www.fupa.net/team/fc-treptow-m1-2026-27/history' },
];
