import { expect, test } from '@playwright/test';

test('admin sidebar collapses and reopens without losing its toggle', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_API_READY, 'Requires the seeded local API.');

  await page.goto('/uz/login');
  await page.getByLabel(/email/i).fill('admin@demo.uz');
  await page.getByLabel(/parol|password/i).fill('invest2026');
  await page.getByRole('button', { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/dashboard/projects');
  const dashboard = page.locator('.invest-dashboard');
  const sidebar = page.locator('#dashboard-sidebar');
  const collapseButton = page.getByRole('button', { name: 'Menyuni yig‘ish' });

  if (testInfo.project.name.includes('mobile')) {
    await expect(sidebar).toHaveCSS('width', '72px');
    await expect(dashboard).toHaveJSProperty('scrollWidth', await dashboard.evaluate((node) => node.clientWidth));
    await expect(collapseButton).toHaveCount(0);
    return;
  }

  await expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
  await collapseButton.click();

  const expandButton = page.getByRole('button', { name: 'Menyuni ochish' });
  await expect(dashboard).toHaveClass(/is-collapsed/);
  await expect(sidebar).toHaveCSS('width', '72px');
  await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  await expect(expandButton).toBeVisible();

  const [sidebarBox, toggleBox] = await Promise.all([
    sidebar.boundingBox(),
    expandButton.boundingBox(),
  ]);
  expect(sidebarBox).not.toBeNull();
  expect(toggleBox).not.toBeNull();
  expect(Math.abs((toggleBox!.x + toggleBox!.width / 2) - (sidebarBox!.x + sidebarBox!.width / 2))).toBeLessThanOrEqual(1);

  await expandButton.click();

  await expect(dashboard).not.toHaveClass(/is-collapsed/);
  await expect(page.getByRole('button', { name: 'Menyuni yig‘ish' })).toHaveAttribute('aria-expanded', 'true');
});
