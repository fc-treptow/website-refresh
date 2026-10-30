// RSS-Feed der News (nur Deutsch, die Quelle aller Beiträge): /news/rss.xml
// Damit lassen sich die News in einem Feedreader verfolgen, ohne soziale Netzwerke und ohne
// Tracking. Von Hand gebaut, ohne zusätzliches Paket.
import type { APIRoute } from 'astro';
import { getNews } from '../../i18n/content';
import { newsImage } from '../../lib/newsImages';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://fct-website-refresh.vercel.app');
  const abs = (path: string) => new URL(path, base).href;
  const news = await getNews('de');

  const items = news
    .slice(0, 30)
    .map((n) => {
      const url = abs(`/news/${n.slug}`);
      const img = n.data.image ? newsImage(n.data.image) : null;
      return [
        '    <item>',
        `      <title>${esc(n.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${n.data.date.toUTCString()}</pubDate>`,
        `      <category>${esc(n.data.tag)}</category>`,
        `      <description>${esc(n.data.teaser)}</description>`,
        img ? `      <enclosure url="${esc(abs(img.src))}" type="${img.src.endsWith('.webp') ? 'image/webp' : 'image/jpeg'}" length="0" />` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FC Treptow e.V. – News</title>
    <link>${abs('/news')}</link>
    <atom:link href="${abs('/news/rss.xml')}" rel="self" type="application/rss+xml" />
    <description>Neuigkeiten vom FC Treptow e.V.</description>
    <language>de</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
