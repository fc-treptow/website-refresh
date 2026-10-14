// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const locales = ['de', 'en', 'tr', 'ar', 'es', 'fr'];

// https://astro.build/config
export default defineConfig({
  // Öffentliche Adresse, wird für hreflang, Canonical und Sitemap gebraucht.
  // Nach dem Umzug auf die eigene Domain SITE_URL in Vercel setzen.
  site: process.env.SITE_URL ?? 'https://fct-website-refresh.vercel.app',
  i18n: {
    defaultLocale: 'de',
    locales,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  image: {
    // Instagram-Bilder werden beim Build geladen und selbst ausgeliefert (siehe src/lib/instagram.ts)
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  // Sitemap mit hreflang-Verweisen zwischen den Sprachfassungen einer Seite.
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: Object.fromEntries(locales.map((l) => [l, l])),
      },
      // Ohne Schrägstrich am Ende, passend zu den Canonical-Links in src/layouts/Base.astro.
      serialize(item) {
        const strip = (/** @type {string} */ u) => u.replace(/(?<!:\/)\/$/, '').replace(/^(https?:\/\/[^/]+)$/, '$1/');
        item.url = strip(item.url);
        item.links = item.links?.map((link) => ({ ...link, url: strip(link.url) }));
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
