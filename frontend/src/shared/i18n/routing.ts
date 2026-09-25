export const locales = ['uz', 'ru'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uz';

export const localeCookieName = 'tashkent-invest.locale';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : undefined;
}

export function localizedPath(locale: Locale, href: string): string {
  const url = new URL(href, 'https://local.invalid');
  const strippedPath = url.pathname.replace(/^\/(?:uz|ru)(?=\/|$)/, '') || '/';
  const pathname = strippedPath === '/' ? `/${locale}` : `/${locale}${strippedPath}`;

  return `${pathname}${url.search}${url.hash}`;
}

export function switchPathLocale(href: string, locale: Locale): string {
  return localizedPath(locale, href);
}
