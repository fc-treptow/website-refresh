// Baut zur Build-Zeit die neuesten Instagram-Beiträge des Vereins ein, sofern ein Zugriffstoken
// hinterlegt ist. Ohne Token wird sauber auf kuratierte Platzhalterbilder zurückgefallen, damit
// die Seite nie kaputt aussieht, nur weil noch niemand den Instagram-Zugang eingerichtet hat.
//
// Einrichtung (einmalig, kostenlos):
// 1. Instagram-Konto des Vereins auf "Professionell" (Business oder Creator) umstellen.
// 2. Das Instagram-Konto mit einer Facebook-Seite des Vereins verknüpfen (Instagram-Einstellungen).
// 3. Auf https://developers.facebook.com eine App anlegen, Produkt "Instagram Graph API" hinzufügen.
// 4. Über den Graph API Explorer ein langlebiges Zugriffstoken für die Facebook-Seite erzeugen
//    (Berechtigungen: instagram_basic, pages_show_list) und gegen ein langlebiges Token tauschen.
// 5. Die Instagram Business Account ID der Seite ermitteln (GET /{page-id}?fields=instagram_business_account).
// 6. INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_BUSINESS_ACCOUNT_ID als Umgebungsvariablen im
//    Hosting-Projekt (z. B. Vercel) hinterlegen. Das Token läuft nach ca. 60 Tagen ab und muss
//    regelmäßig erneuert werden (z. B. per Cron-Job, der den Facebook-Token-Refresh-Endpunkt aufruft).
//
// Ohne diese Einrichtung (oder wenn das Token abgelaufen ist) zeigt die Startseite die
// handverlesenen Beiträge aus dem CMS (Instagram-Beiträge, src/content/instagram). Fehlen auch
// die, bleibt nur der Hinweis mit dem Link zum Profil. Bewusst keine Platzhalterbilder: fremde
// Fotos als "Vereinsleben" wären Täuschung.
//
// Umschalten braucht keine Codeänderung: Umgebungsvariablen in Vercel setzen, neu bauen.
//
// Datenschutz: Die Bilder werden zur Build-Zeit über astro:assets heruntergeladen und von
// unserer eigenen Domain ausgeliefert. Besucher laden nichts direkt von Instagram/Meta. Die
// handverlesenen Fotos liegen ohnehin im Repository (public/images/instagram).

import { getCollection } from 'astro:content';

export interface SocialPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption?: string;
  isVideo?: boolean;
}

export type SocialSource = 'api' | 'manual' | 'none';

/** Neueste Beiträge von Instagram, sonst die Auswahl aus dem CMS, sonst nichts */
export async function getSocialPosts(limit = 4): Promise<{ posts: SocialPost[]; source: SocialSource }> {
  const live = await getInstagramPosts(limit);
  if (live.isLive) return { posts: live.posts, source: 'api' };
  const manual = (await getCollection('instagram'))
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, limit)
    .map((e) => ({ id: e.id, imageUrl: e.data.image, permalink: e.data.url, caption: e.data.alt, isVideo: e.data.video }));
  return { posts: manual, source: manual.length ? 'manual' : 'none' };
}

export async function getInstagramPosts(limit = 6): Promise<{ posts: SocialPost[]; isLive: boolean }> {
  const token = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = import.meta.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !accountId) {
    return { posts: [], isLive: false };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${limit}&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Instagram API responded ${res.status}`);
    const data = await res.json();
    const posts: SocialPost[] = (data.data ?? [])
      .filter((item: any) => item.media_type !== 'VIDEO' || item.thumbnail_url)
      .slice(0, limit)
      .map((item: any) => ({
        id: item.id,
        imageUrl: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
        permalink: item.permalink,
        caption: item.caption,
        isVideo: item.media_type === 'VIDEO',
      }));
    return { posts, isLive: posts.length > 0 };
  } catch {
    // Netzwerkfehler oder abgelaufenes Token: Build nicht brechen, sauber zurückfallen.
    return { posts: [], isLive: false };
  }
}
