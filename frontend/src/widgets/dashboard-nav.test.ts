import { describe, expect, it } from 'vitest';
import { getDashboardNavigation } from './dashboard-nav';

describe('getDashboardNavigation', () => {
  it('returns role-specific routes from the single dashboard route tree', () => {
    expect(getDashboardNavigation('investor').map((entry) => entry.href)).toContain('/dashboard/map');
    expect(getDashboardNavigation('admin').map((entry) => entry.href)).toEqual([
      '/dashboard',
      '/dashboard/projects',
    ]);
  });
});
