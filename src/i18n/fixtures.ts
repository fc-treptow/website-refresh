import type { Locale } from './languages';
import { bcp47 } from './languages';
import type { FixturesLabels } from '../lib/fixturesView';

type Base = Omit<FixturesLabels, 'locale'>;

const labels: Record<Locale, Base> = {
  de: {
    noResults: 'Noch keine Ergebnisse in dieser Saison.', today: 'Heute',
    notes: { cancelled: 'Abgesetzt', forfeitOpponent: 'Gegner nicht angetreten', forfeitUs: 'Nicht angetreten' }, win: 'Sieg', draw: 'Remis', loss: 'Niederlage',
    home: 'Heim', away: 'Auswärts', vs: 'bei', provisional: 'Ansetzungen teils vorläufig, noch nicht vom Staffelleiter freigegeben.',
    noGames: 'Gerade sind keine Spiele angesetzt.', unavailable: 'fussball.de ist gerade nicht erreichbar. Spielplan und Tabelle direkt dort ansehen.',
    source: 'Daten: fussball.de', matchLink: 'Spiel auf fussball.de öffnen',
    table: { rank: 'Pl.', club: 'Mannschaft', played: 'Sp.', goals: 'Tore', diff: 'Diff.', points: 'Pkt.', caption: 'Tabelle' },
  },
  en: {
    noResults: 'No results yet this season.', today: 'Today',
    notes: { cancelled: 'Postponed', forfeitOpponent: 'Opponent no-show', forfeitUs: 'Forfeited' }, win: 'Win', draw: 'Draw', loss: 'Loss',
    home: 'Home', away: 'Away', vs: 'at', provisional: 'Some fixtures are provisional and not yet confirmed by the league.',
    noGames: 'No matches scheduled right now.', unavailable: 'fussball.de is unavailable right now. See fixtures and table there directly.',
    source: 'Data: fussball.de', matchLink: 'Open match on fussball.de',
    table: { rank: 'Pos', club: 'Team', played: 'P', goals: 'Goals', diff: 'GD', points: 'Pts', caption: 'League table' },
  },
  tr: {
    noResults: 'Bu sezon henüz sonuç yok.', today: 'Bugün',
    notes: { cancelled: 'Ertelendi', forfeitOpponent: 'Rakip gelmedi', forfeitUs: 'Hükmen yenilgi' }, win: 'Galibiyet', draw: 'Beraberlik', loss: 'Mağlubiyet',
    home: 'İç saha', away: 'Deplasman', vs: 'deplasmanda', provisional: 'Bazı maçlar geçicidir, lig yöneticisi henüz onaylamadı.',
    noGames: 'Şu anda planlanmış maç yok.', unavailable: 'fussball.de şu anda erişilemiyor. Fikstür ve puan durumuna doğrudan oradan bakabilirsin.',
    source: 'Veriler: fussball.de', matchLink: 'Maçı fussball.de’de aç',
    table: { rank: 'S', club: 'Takım', played: 'O', goals: 'Gol', diff: 'Av', points: 'P', caption: 'Puan durumu' },
  },
  ar: {
    noResults: 'لا توجد نتائج بعد هذا الموسم.', today: 'اليوم',
    notes: { cancelled: 'أُلغيت', forfeitOpponent: 'لم يحضر المنافس', forfeitUs: 'لم نحضر' }, win: 'فوز', draw: 'تعادل', loss: 'خسارة',
    home: 'على أرضنا', away: 'خارج الأرض', vs: 'ضد', provisional: 'بعض المواعيد مؤقتة ولم يعتمدها مسؤول الدوري بعد.',
    noGames: 'لا توجد مباريات مجدولة حاليًا.', unavailable: 'موقع fussball.de غير متاح حاليًا. يمكنك مشاهدة المباريات والترتيب هناك مباشرة.',
    source: 'البيانات: fussball.de', matchLink: 'افتح المباراة على fussball.de',
    table: { rank: 'م', club: 'الفريق', played: 'لعب', goals: 'الأهداف', diff: 'فارق', points: 'نقاط', caption: 'جدول الترتيب' },
  },
  es: {
    noResults: 'Todavía no hay resultados esta temporada.', today: 'Hoy',
    notes: { cancelled: 'Aplazado', forfeitOpponent: 'Rival no presentado', forfeitUs: 'No presentado' }, win: 'Victoria', draw: 'Empate', loss: 'Derrota',
    home: 'Local', away: 'Visitante', vs: 'en', provisional: 'Algunos partidos son provisionales y aún no están confirmados por la liga.',
    noGames: 'Ahora mismo no hay partidos programados.', unavailable: 'fussball.de no está disponible ahora. Consulta el calendario y la clasificación allí directamente.',
    source: 'Datos: fussball.de', matchLink: 'Abrir el partido en fussball.de',
    table: { rank: 'Pos', club: 'Equipo', played: 'PJ', goals: 'Goles', diff: 'Dif', points: 'Pts', caption: 'Clasificación' },
  },
  fr: {
    noResults: 'Pas encore de résultats cette saison.', today: 'Aujourd’hui',
    notes: { cancelled: 'Reporté', forfeitOpponent: 'Adversaire forfait', forfeitUs: 'Forfait' }, win: 'Victoire', draw: 'Nul', loss: 'Défaite',
    home: 'Domicile', away: 'Extérieur', vs: 'à', provisional: 'Certains matchs sont provisoires et pas encore validés par la ligue.',
    noGames: 'Aucun match programmé pour le moment.', unavailable: 'fussball.de est indisponible pour le moment. Consulte le calendrier et le classement directement là-bas.',
    source: 'Données : fussball.de', matchLink: 'Ouvrir le match sur fussball.de',
    table: { rank: 'Pl', club: 'Équipe', played: 'J', goals: 'Buts', diff: 'Diff', points: 'Pts', caption: 'Classement' },
  },
};

export function fixturesLabels(locale: Locale): FixturesLabels {
  return { ...labels[locale], locale: bcp47[locale] };
}
