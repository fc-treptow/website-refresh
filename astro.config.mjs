// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
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
