import { describe, expect, test } from 'vitest';
import { GET } from './llms.txt/route';

describe('/llms.txt', () => {
  test('publishes a bilingual canonical public directory', async () => {
    const response = GET();
    const text = await response.text();

    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(text).toContain('Uzbek');
    expect(text).toContain('Russian');
    expect(text).toContain('https://toshkent-tuman-invest.uz/uz');
    expect(text).toContain('https://toshkent-tuman-invest.uz/ru/map');
    expect(text).toContain('https://toshkent-tuman-invest.uz/sitemap.xml');
    expect(text).not.toContain('/dashboard');
    expect(text).not.toContain('/login');
  });
});
