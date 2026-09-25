import { describe, expect, it } from 'vitest';
import { legacyPublicHref } from './_legacy-public-redirect';

describe('legacyPublicHref', () => {
  it('preserves repeated and encoded query parameters', () => {
    expect(
      legacyPublicHref('/map', {
        types: ['land', 'building'],
        q: 'bo‘sh yer',
        omitted: undefined,
      }),
    ).toBe('/uz/map?types=land&types=building&q=bo%E2%80%98sh+yer');
  });

  it('redirects the root path to the default locale root', () => {
    expect(legacyPublicHref('/', { ref: 'google' })).toBe('/uz?ref=google');
  });
});
