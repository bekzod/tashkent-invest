import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, localeFromPath } from '@/shared/i18n/routing';

const bypassedPaths = [
  /^\/api(?:\/|$)/,
  /^\/_next(?:\/|$)/,
  /^\/favicon\.ico$/,
  /^\/(?:icon|apple-icon)(?:\.|\/|$)/,
  /^\/robots\.txt$/,
  /^\/sitemap(?:-[a-z]{2})?\.xml$/,
  /^\/llms\.txt$/,
  /\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|webp|woff2?)$/,
];

function shouldBypass(pathname: string) {
  return bypassedPaths.some((pattern) => pattern.test(pathname));
}

function isLegacyPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/map' ||
    pathname === '/login' ||
    /^\/objects\/[^/]+\/?$/.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) return NextResponse.next();

  const locale = localeFromPath(pathname);
  if (locale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-invest-locale', locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isLegacyPublicPath(pathname)) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(destination, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
