import { describe, expect, test } from 'vitest';
import { resolveApiBaseUrl } from './base-url';

describe('resolveApiBaseUrl', () => {
  test('adds /api to a host-only URL', () => {
    expect(resolveApiBaseUrl('https://backend.example.com')).toBe(
      'https://backend.example.com/api',
    );
  });

  test('preserves /api and removes a trailing slash', () => {
    expect(resolveApiBaseUrl('https://backend.example.com/api/')).toBe(
      'https://backend.example.com/api',
    );
  });
});
