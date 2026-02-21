import { test, expect } from '@playwright/test';

test.describe('i18n - language switching', () => {
  test('switches to Hebrew and back to English', async ({ page }) => {
    await page.goto('/plans');

    const langToggle = page.getByTestId('lang-toggle');
    await expect(langToggle).toBeVisible();
    await expect(langToggle).toHaveText('עב');

    const plansNav = page.getByRole('link', { name: 'Plans' });
    await expect(plansNav).toBeVisible();

    await langToggle.click();

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    await expect(langToggle).toHaveText('EN');

    const hebrewPlansNav = page.getByRole('link', { name: 'תוכניות' });
    await expect(hebrewPlansNav).toBeVisible();

    await langToggle.click();

    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(plansNav).toBeVisible();
  });
});
