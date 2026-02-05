import { test, expect } from '@playwright/test';

test.describe('Plans Page', () => {
  test('displays plans successfully when API returns data', async ({
    page,
  }) => {
    await page.goto('/plans');

    await expect(page.getByText('Loading plans...')).toBeVisible();

    await expect(page.getByText('Loading plans...')).not.toBeVisible({
      timeout: 10000,
    });

    const plansContainer = page.locator('main');
    await expect(plansContainer).toBeVisible();
  });

  test('displays user-friendly error when API fails', async ({ page }) => {
    await page.route('**/plans', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/plans');

    await expect(page.getByText('Server Error')).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByText(/Something went wrong on our end/)
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('displays connection error when network fails', async ({ page }) => {
    await page.route('**/plans', (route) => {
      route.abort('failed');
    });

    await page.goto('/plans');

    await expect(page.getByText('Connection Problem')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('displays config error when API returns HTML', async ({ page }) => {
    await page.route('**/plans', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><body>Not Found</body></html>',
      });
    });

    await page.goto('/plans');

    await expect(page.getByText('Server Configuration Error')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
});
