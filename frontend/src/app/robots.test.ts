import { describe, expect, test } from 'vitest';
import robots from './robots';

describe('crawler policy', () => {
  test('allows public locale pages and applies private exclusions to every crawler', () => {
    const policy = robots();
    const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];

    expect(policy.sitemap).toBe('https://toshkent-tuman-invest.uz/sitemap.xml');
    expect(rules.map((rule) => rule.userAgent)).toEqual(['*', 'OAI-SearchBot', 'GPTBot']);
    for (const rule of rules) {
      expect(rule.allow).toEqual(['/uz/', '/ru/']);
      expect(rule.disallow).toEqual([
        '/dashboard',
        '/profile',
        '/uz/login',
        '/ru/login',
        '/api',
      ]);
    }
  });
});
