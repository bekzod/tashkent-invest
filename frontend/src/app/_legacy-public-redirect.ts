import { permanentRedirect } from 'next/navigation';
import { defaultLocale, localizedPath } from '@/shared/i18n/routing';

export type LegacySearchParams = Record<string, string | string[] | undefined>;

export function legacyPublicHref(pathname: string, searchParams: LegacySearchParams = {}) {
  const query = new URLSearchParams();

  for (const [name, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(name, item));
    } else if (value !== undefined) {
      query.append(name, value);
    }
  }

  const search = query.size > 0 ? `?${query.toString()}` : '';
  return localizedPath(defaultLocale, `${pathname}${search}`);
}

export function redirectLegacyPublicPath(
  pathname: string,
  searchParams: LegacySearchParams = {},
): never {
  permanentRedirect(legacyPublicHref(pathname, searchParams));
}
