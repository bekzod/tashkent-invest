import { describe, expect, it } from 'vitest';
import { uniqueObjects } from './unique-objects';

describe('uniqueObjects', () => {
  it('removes duplicate object ids while preserving the request order', () => {
    const objects = [
      { id: 'auction', slug: 'auction' },
      { id: 'auction', slug: 'auction-copy' },
      { id: 'building', slug: 'building' },
    ] as never[];

    expect(uniqueObjects(objects).map((object) => object.id)).toEqual(['auction', 'building']);
  });
});
