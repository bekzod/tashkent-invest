import { expect, test } from '@playwright/test';

test('clicking a registry item selects and focuses its map object', async ({ page }) => {
  test.skip(!process.env.E2E_API_READY, 'Requires the seeded local API.');
  await page.goto('/map');

  const card = page.getByTestId('map-result-card').first();
  await expect(card).toBeVisible();
  const objectId = await card.getAttribute('data-object-id');
  await card.click({ position: { x: 100, y: 145 } });

  await expect(card).toHaveClass(/selected/);
  await expect(page.locator('.map-canvas')).toHaveAttribute('data-selected-object-id', objectId!);
});
