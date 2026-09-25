import { describe, expect, test } from 'vitest';
import {
  isLocale,
  localeFromPath,
  localizedPath,
  switchPathLocale,
} from './routing';

describe('locale routing', () => {
  test('accepts only supported locale segments', () => {
    expect(isLocale('uz')).toBe(true);
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('en')).toBe(false);
  });

  test('adds a locale prefix while preserving URL details', () => {
    expect(localizedPath('ru', '/map?q=land')).toBe('/ru/map?q=land');
    expect(localizedPath('uz', '/objects/example')).toBe('/uz/objects/example');
    expect(localizedPath('ru', '/uz/map?q=land#results')).toBe('/ru/map?q=land#results');
    expect(localizedPath('uz', '/')).toBe('/uz');
  });

  test('switches an existing localized path', () => {
    expect(switchPathLocale('/uz/objects/example?from=map', 'ru')).toBe(
      '/ru/objects/example?from=map',
    );
  });

  test('reads locale only from the first path segment', () => {
    expect(localeFromPath('/ru/map')).toBe('ru');
    expect(localeFromPath('/dashboard')).toBeUndefined();
    expect(localeFromPath('/map/ru')).toBeUndefined();
  });
});
