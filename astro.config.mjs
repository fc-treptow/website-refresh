// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { emailHastPlugin } from './src/lib/markdownEmail.ts';

// https://astro.build/config
export default defineConfig({
  // Öffentliche Adresse, wird für hreflang, Canonical und Sitemap gebraucht.
  // Nach dem Umzug auf die eigene Domain SITE_URL in Vercel setzen.
  site: process.env.SITE_URL ?? 'https://fct-website-refresh.vercel.app',
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'tr', 'ar', 'es', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // sitemap-index.xml für Suchmaschinen, mit hreflang je Sprache. Die Redaktion (/admin) und
  // die Anmeldeweiterleitung gehören nicht hinein.
  integrations: [
    sitemap({
      filter: (page) => !/\/(admin|anmeldung)\/?$/.test(new URL(page).pathname.replace(/^\/(en|tr|ar|es|fr)(?=\/)/, '')),
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de', en: 'en', tr: 'tr', ar: 'ar', es: 'es', fr: 'fr' },
      },
    }),
  ],
  markdown: {
    // mailto-Links in Markdown nicht im Klartext ausliefern (siehe src/lib/email.ts)
    processor: satteri({ hastPlugins: [emailHastPlugin] }),
  },
  image: {
    // Instagram-Bilder werden beim Build geladen und selbst ausgeliefert (siehe src/lib/instagram.ts)
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
