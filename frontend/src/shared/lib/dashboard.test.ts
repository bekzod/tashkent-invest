import { describe, expect, it } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { pluralMessageKey, projectAreaLabel } from './dashboard';

const project = (area: Partial<InvestmentObject>): InvestmentObject => ({
  id: '1',
  slug: 'test',
  title: 'Test',
  shortDescription: 'Test',
  address: 'Test',
  district: 'Test',
  type: 'land',
  status: 'available',
  investmentAmountUsd: 0,
  ...area,
});

describe('localized dashboard formatting', () => {
  it.each([
    [1, 'objectOne'],
    [2, 'objectFew'],
    [5, 'objectMany'],
    [11, 'objectMany'],
    [21, 'objectOne'],
    [24, 'objectFew'],
    [25, 'objectMany'],
  ])('selects the Russian plural for %i', (count, key) => {
    expect(pluralMessageKey(count, 'ru', 'object')).toBe(key);
  });

  it('localizes hectare units and number formatting', () => {
    expect(projectAreaLabel(project({ landAreaHa: 1_234.5 }), 'uz')).toMatch(/^1\s234,5 ga$/);
    expect(projectAreaLabel(project({ landAreaHa: 1_234.5 }), 'ru')).toMatch(/^1\s234,5 га$/);
    expect(projectAreaLabel(project({ buildingAreaSqm: 1_234 }), 'ru')).toMatch(/^1\s234 m²$/);
  });
});
