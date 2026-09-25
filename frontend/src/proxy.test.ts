import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

function request(path: string) {
  return new NextRequest(`https://toshkent-tuman-invest.uz${path}`);
}

describe('proxy', () => {
  it.each([
    ['/?utm_source=google', '/uz?utm_source=google'],
    ['/map?types=land&types=building', '/uz/map?types=land&types=building'],
    ['/objects/demo?from=map', '/uz/objects/demo?from=map'],
    ['/login?next=%2Fdashboard', '/uz/login?next=%2Fdashboard'],
  ])('permanently redirects the legacy public URL %s', (path, expectedPath) => {
    const response = proxy(request(path));

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      `https://toshkent-tuman-invest.uz${expectedPath}`,
    );
  });

  it('forwards a validated locale to server components', () => {
    const response = proxy(request('/ru/map'));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('x-middleware-request-x-invest-locale')).toBe('ru');
  });

  it('does not redirect private routes', () => {
    const response = proxy(request('/dashboard'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-request-x-invest-locale')).toBeNull();
  });

  it.each([
    '/api/objects',
    '/_next/static/chunk.js',
    '/images/hero.webp',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-uz.xml',
    '/llms.txt',
  ])('bypasses locale routing for %s', (path) => {
    const response = proxy(request(path));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-request-x-invest-locale')).toBeNull();
  });
});
