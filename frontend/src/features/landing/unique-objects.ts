import type { InvestmentObject } from '@/entities/investment-object/types';

/**
 * Landing cards are assembled from several filtered API requests. Retain the
 * first response for each object so an API overlap can never render duplicate
 * cards or duplicate React keys.
 */
export function uniqueObjects(objects: InvestmentObject[]) {
  const seen = new Set<string>();

  return objects.filter((object) => {
    if (seen.has(object.id)) return false;
    seen.add(object.id);
    return true;
  });
}
