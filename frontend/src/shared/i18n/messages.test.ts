import { describe, expect, it } from 'vitest';
import { messages } from './messages';

describe('translation catalog', () => {
  it('keeps the Uzbek and Russian catalogs in sync', () => {
    expect(Object.keys(messages.ru).sort()).toEqual(Object.keys(messages.uz).sort());
  });

  it('does not contain blank translations', () => {
    for (const locale of Object.keys(messages) as Array<keyof typeof messages>) {
      expect(Object.values(messages[locale]).every((message) => message.trim().length > 0)).toBe(true);
    }
  });
});
