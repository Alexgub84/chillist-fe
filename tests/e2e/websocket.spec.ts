import {
  test,
  expect,
  buildPlan,
  mockPlanRoutes,
  injectUserSession,
} from './fixtures';

function buildTestPlan() {
  return buildPlan({
    title: 'WS Test Plan',
    participants: [
      {
        name: 'Alex',
        lastName: 'Test',
        phone: '555-0100',
        role: 'owner',
        userId: 'regular-user-id',
      },
      { name: 'Bob', lastName: 'Helper', phone: '555-0200' },
    ],
    items: [
      { name: 'Tent', category: 'equipment', quantity: 2 },
      { name: 'Water', category: 'food', quantity: 3 },
    ],
  });
}

test.describe('WebSocket — Graceful Degradation', () => {
  test('plan page loads and items are visible even when WebSocket is unavailable', async ({
    page,
  }) => {
    await injectUserSession(page);
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    const wsErrors: string[] = [];
    page.on('websocket', (ws) => {
      ws.on('socketerror', (error) => wsErrors.push(String(error)));
    });

    await page.goto(`/plan/${plan.planId}`);

    await expect(page.getByTestId('plan-title').first()).toHaveText(
      'WS Test Plan',
      { timeout: 10000 }
    );

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();

    await expect(page.getByTestId('speed-dial-trigger')).toBeVisible();
  });

  test('items page loads and displays items when WebSocket connection fails', async ({
    page,
  }) => {
    await injectUserSession(page);
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByTestId('plan-title').first()).toHaveText(
      'WS Test Plan',
      { timeout: 10000 }
    );

    await page.getByText('Manage Items').click();
    await expect(page).toHaveURL(/\/items\//, { timeout: 10000 });

    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Water')).toBeVisible();
  });

  test('item CRUD works normally without WebSocket', async ({ page }) => {
    await injectUserSession(page);
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByTestId('plan-title').first()).toHaveText(
      'WS Test Plan',
      { timeout: 10000 }
    );

    await page.getByTestId('speed-dial-trigger').click();
    await page.getByTestId('add-item-fab').click();

    const modal = page.getByTestId('add-item-modal');
    await expect(modal).toBeVisible();

    const form = modal.locator('form');
    const nameInput = form.getByPlaceholder('Item name');
    await nameInput.fill('Sleeping Bag');

    const option = page.getByRole('option', {
      name: 'Sleeping Bag',
      exact: true,
    });
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click({ force: true });

    const submitBtn = form.locator('button[type="submit"]');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/items') && r.request().method() === 'POST'
      ),
      submitBtn.click({ force: true }),
    ]);

    await expect(modal).toBeHidden({ timeout: 10000 });
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Sleeping Bag' })
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe('WebSocket — Connection Attempt', () => {
  async function interceptWebSocketUrls(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
      (window as unknown as Record<string, string[]>).__wsUrls = [];
      const OrigWS = window.WebSocket;
      window.WebSocket = function (
        url: string | URL,
        protocols?: string | string[]
      ) {
        (window as unknown as Record<string, string[]>).__wsUrls.push(
          String(url)
        );
        return new OrigWS(url, protocols);
      } as unknown as typeof WebSocket;
      window.WebSocket.prototype = OrigWS.prototype;
      window.WebSocket.CONNECTING = OrigWS.CONNECTING;
      window.WebSocket.OPEN = OrigWS.OPEN;
      window.WebSocket.CLOSING = OrigWS.CLOSING;
      window.WebSocket.CLOSED = OrigWS.CLOSED;
    });
  }

  function getWsUrls(page: import('@playwright/test').Page) {
    return page.evaluate(
      () => (window as unknown as Record<string, string[]>).__wsUrls ?? []
    );
  }

  test('app attempts WebSocket connection to the correct URL when viewing a plan', async ({
    page,
  }) => {
    await interceptWebSocketUrls(page);
    await injectUserSession(page);
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByTestId('plan-title').first()).toHaveText(
      'WS Test Plan',
      { timeout: 10000 }
    );

    await expect
      .poll(() => getWsUrls(page), { timeout: 5000 })
      .toEqual(
        expect.arrayContaining([
          expect.stringContaining(`/plans/${plan.planId}/ws`),
        ])
      );

    const urls = await getWsUrls(page);
    const planWsUrl = urls.find((url) =>
      url.includes(`/plans/${plan.planId}/ws`)
    );
    expect(planWsUrl).toContain('token=');
  });

  test('app attempts WebSocket connection on items page', async ({ page }) => {
    await interceptWebSocketUrls(page);
    await injectUserSession(page);
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByTestId('plan-title').first()).toHaveText(
      'WS Test Plan',
      { timeout: 10000 }
    );

    await page.getByText('Manage Items').click();
    await expect(page).toHaveURL(/\/items\//, { timeout: 10000 });
    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });

    await expect
      .poll(() => getWsUrls(page), { timeout: 5000 })
      .toEqual(
        expect.arrayContaining([
          expect.stringContaining(`/plans/${plan.planId}/ws`),
        ])
      );
  });
});
