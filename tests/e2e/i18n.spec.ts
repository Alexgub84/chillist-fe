import { test, expect, Page } from '@playwright/test';

async function toggleLanguage(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByLabel('Toggle menu').click();
    const toggle = page.getByTestId('lang-toggle-mobile');
    await expect(toggle).toBeVisible();
    await toggle.click();
  } else {
    await page.getByTestId('lang-toggle').click();
  }
}

async function getLangToggleText(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByLabel('Toggle menu').click();
    const toggle = page.getByTestId('lang-toggle-mobile');
    await expect(toggle).toBeVisible();
    const text = await toggle.textContent();
    await page.getByLabel('Toggle menu').click();
    return text;
  }
  return page.getByTestId('lang-toggle').textContent();
}

test.describe('i18n - language switching', () => {
  test('switches to Hebrew and back to English', async ({ page, isMobile }) => {
    await page.goto('/plans');

    const initialText = await getLangToggleText(page, isMobile);
    expect(initialText).toBe('עב');

    const plansNav = page.getByRole('link', { name: 'Plans' });
    if (!isMobile) {
      await expect(plansNav).toBeVisible();
    }

    await toggleLanguage(page, isMobile);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    const hebrewText = await getLangToggleText(page, isMobile);
    expect(hebrewText).toBe('EN');

    if (!isMobile) {
      const hebrewPlansNav = page.getByRole('link', { name: 'תוכניות' });
      await expect(hebrewPlansNav).toBeVisible();
    }

    await toggleLanguage(page, isMobile);

    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    if (!isMobile) {
      await expect(plansNav).toBeVisible();
    }
  });
});
