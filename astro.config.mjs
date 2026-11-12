// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { emailHastPlugin } from './src/lib/markdownEmail.ts';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

// Info-Seiten (src/content/seiten/de), die nicht in die Sitemap gehören: "Vor Suchmaschinen
// verbergen" angehakt oder "Gültig bis" vorbei. Die Seiten selbst setzen dann noindex.
const heute = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const seitenDir = './src/content/seiten/de';
const versteckteSeiten = new Set(
  (existsSync(seitenDir) ? readdirSync(seitenDir) : [])
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const fm = readFileSync(`${seitenDir}/${f}`, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const bis = fm.match(/^bis:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      return /^noindex:\s*true\s*$/m.test(fm) || (bis && heute > bis);
    })
    .map((f) => `/info/${f.replace(/\.md$/, '')}`),
);

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
  // die Anmeldeweiterleitung gehören nicht hinein, ebenso verborgene oder abgelaufene Info-Seiten.
  integrations: [
    sitemap({
      filter: (page) => {
        const p = new URL(page).pathname.replace(/^\/(en|tr|ar|es|fr)(?=\/)/, '').replace(/\/$/, '');
        return !/\/(admin|anmeldung)$/.test(p) && !versteckteSeiten.has(p);
      },
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
