// robots.txt: alles erlaubt, mit Verweis auf die Sitemap. Als Endpunkt statt als Datei in
// public/, damit die Sitemap-Adresse der Domain aus SITE_URL folgt (siehe astro.config.mjs).
//
// KI-Crawler sind ausdrücklich erlaubt: Der Verein will gefunden werden, auch in Antworten von
// ChatGPT, Claude, Perplexity und Google. Wer das ändern will, setzt die betreffende Gruppe
// unten auf "Disallow: /".
import type { APIRoute } from 'astro';

const aiCrawlers = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://fct-website-refresh.vercel.app');
  const body = [
    'User-agent: *',
    'Disallow: /admin',
    'Allow: /',
    '',
    '# KI-Assistenten und ihre Suche: erlaubt',
    ...aiCrawlers.map((bot) => `User-agent: ${bot}`),
    'Disallow: /admin',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', base).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
