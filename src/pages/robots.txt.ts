import type { APIRoute } from 'astro';

// robots.txt wird beim Build erzeugt, damit der Sitemap-Link immer zur Adresse aus `site`
// (bzw. SITE_URL) passt. Die vercel.app-Adressen werden nicht hier gesperrt, sondern per
// X-Robots-Tag: noindex in vercel.json – ein Disallow würde Suchmaschinen daran hindern,
// diesen Header überhaupt zu sehen.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin/', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
