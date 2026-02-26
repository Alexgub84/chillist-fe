import { test, expect, Page } from '@playwright/test';

async function selectLanguage(page: Page, isMobile: boolean, langCode: string) {
  if (isMobile) {
    await page.getByLabel('Toggle menu').click();
    await page.getByTestId('lang-toggle-mobile').click();
    const option = page.getByTestId(`lang-toggle-mobile-${langCode}`);
    await expect(option).toBeVisible();
    await option.click();
  } else {
    await page.getByTestId('lang-toggle').click();
    const option = page.getByTestId(`lang-option-${langCode}`);
    await expect(option).toBeVisible();
    await option.click();
  }
}

test.describe('i18n - language switching', () => {
  test('switches to Hebrew and back to English', async ({ page, isMobile }) => {
    await page.goto('/plans');

    const plansNav = page.getByRole('link', { name: 'Plans' });
    if (!isMobile) {
      await expect(plansNav).toBeVisible();
    }

    await selectLanguage(page, isMobile, 'he');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    if (!isMobile) {
      const hebrewPlansNav = page.getByRole('link', { name: 'תוכניות' });
      await expect(hebrewPlansNav).toBeVisible();
    }

    await selectLanguage(page, isMobile, 'en');

    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    if (!isMobile) {
      await expect(plansNav).toBeVisible();
    }
  });
});
