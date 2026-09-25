import type { InvestmentObject } from '@/entities/investment-object/types';
import { localizedPath, type Locale } from '@/shared/i18n/routing';
import { absoluteUrl } from '@/shared/lib/seo';

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function document(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

export function buildSitemapIndex() {
  const urls = ['uz', 'ru'].map((locale) => absoluteUrl(`/sitemap-${locale}.xml`));
  return document(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
      .join('')}</sitemapindex>`,
  );
}

function validLastModified(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function alternateLinks(path: string) {
  return (['uz', 'ru'] as const)
    .map(
      (locale) =>
        `<xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(
          absoluteUrl(localizedPath(locale, path)),
        )}"/>`,
    )
    .concat(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
        absoluteUrl(localizedPath('uz', path)),
      )}"/>`,
    )
    .join('');
}

function urlEntry(locale: Locale, path: string, lastModified?: string) {
  const loc = absoluteUrl(localizedPath(locale, path));
  return `<url><loc>${escapeXml(loc)}</loc>${alternateLinks(path)}${
    lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ''
  }</url>`;
}

export function buildLocaleSitemap(locale: Locale, objects: InvestmentObject[]) {
  const eligible = objects.filter(
    (object) =>
      Boolean(object.slug && object.title && validLastModified(object.updatedAt)) &&
      ['available', 'auction', 'upcoming'].includes(object.status),
  );
  const entries = [urlEntry(locale, '/'), urlEntry(locale, '/map')];
  const seen = new Set<string>();
  for (const object of eligible) {
    if (seen.has(object.slug)) continue;
    seen.add(object.slug);
    entries.push(
      urlEntry(locale, `/objects/${object.slug}`, validLastModified(object.updatedAt)),
    );
  }
  return document(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join(
      '',
    )}</urlset>`,
  );
}
