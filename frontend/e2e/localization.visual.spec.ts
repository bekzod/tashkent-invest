import { expect, test, type Page } from '@playwright/test';

async function expectLocalizedSnapshot(page: Page, name: string) {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    mask: [page.locator('.map-canvas'), page.locator('img')],
  });
}

test('localized Russian landing page visual', async ({ page }) => {
  await page.goto('/ru');
  await expect(page.getByRole('heading', { name: 'Инвестируйте в будущее района' })).toBeVisible();
  await expectLocalizedSnapshot(page, 'localization-russian-home.png');
});

test('localized Uzbek and Russian error visuals', async ({ page }) => {
  await page.goto('/uz/missing-page');
  await expect(page.getByText('Bu sahifa topilmadi.')).toBeVisible();
  await expectLocalizedSnapshot(page, 'localization-uzbek-404.png');

  await page.goto('/ru/missing-page');
  await expect(page.getByText('Страница не найдена.')).toBeVisible();
  await expectLocalizedSnapshot(page, 'localization-russian-404.png');
});

test('localized Russian login visual', async ({ page }) => {
  await page.goto('/ru/login');
  await expect(page.getByRole('heading', { name: 'Вход в кабинет инвестора' })).toBeVisible();
  await expectLocalizedSnapshot(page, 'localization-russian-login.png');
});
