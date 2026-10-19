// Markdown-Plugin (Sätteri, HTML-Baum): schützt mailto-Links in Markdown-Inhalten
// (Datenschutzerklärung, News, Teams) genauso wie die Email-Komponente. Der Text der Dateien
// bleibt unverändert; umgebaut wird nur das erzeugte HTML (siehe src/lib/email.ts und
// src/lib/revealEmails.ts).
// Die Version von @astrojs/markdown-satteri in package.json muss der entsprechen, die Astro
// selbst mitbringt (steht in node_modules/astro/package.json), sonst laufen zwei Fassungen.
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import type { Element, ElementContent } from 'hast';
import { emailDisplay, encodeEmail } from './email';

type HastPlugin = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];

export const emailHastPlugin: HastPlugin = {
  name: 'fct-email',
  element: {
    filter: ['a'],
    visit(node: Element, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !href.toLowerCase().startsWith('mailto:')) return;
      const [rawAddress, query = ''] = href.slice('mailto:'.length).split('?');
      const address = decodeURIComponent(rawAddress);
      const subject = new URLSearchParams(query).get('subject');
      const { href: _href, ...properties } = node.properties;
      const replacement: Element = {
        type: 'element',
        tagName: 'a',
        properties: {
          ...properties,
          dataEmail: encodeEmail(address),
          ...(subject ? { dataEmailSubject: subject } : {}),
        },
        // Steht die Adresse selbst als Linktext da, wird sie zur lesbaren Ersatzform
        children: node.children.map((child): ElementContent =>
          child.type === 'text' && child.value.trim() === address
            ? { type: 'element', tagName: 'span', properties: { dataEmailText: '' }, children: [{ type: 'text', value: emailDisplay(address) }] }
            : child,
        ),
      };
      ctx.replaceNode(node, replacement);
    },
  },
};
