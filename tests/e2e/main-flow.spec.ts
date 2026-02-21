import {
  test,
  expect,
  type Page,
  buildPlan,
  mockPlanRoutes,
  mockPlansListRoutes,
} from './fixtures';

async function addItemViaUI(
  page: Page,
  name: string,
  quantity: number
): Promise<void> {
  await page.getByRole('button', { name: /^\+\s*Add Item$/i }).click();

  const form = page.locator('form:has(button[type="submit"])').last();
  await expect(form).toBeVisible();

  const nameInput = form.getByPlaceholder('Item name');
  await nameInput.fill(name);
  const option = page.getByRole('option', { name, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click({ force: true });

  const quantityInput = form.locator('input[type="number"]');
  await quantityInput.fill(String(quantity));

  await form.locator('button[type="submit"]').click();
  await expect(form).toBeHidden({ timeout: 5000 });
}

function buildTestPlan() {
  return buildPlan({
    title: 'E2E Test Trip',
    participants: [
      { name: 'Alex', lastName: 'Test', phone: '555-0100', role: 'owner' },
      { name: 'Bob', lastName: 'Helper', phone: '555-0200' },
      { name: 'Carol', lastName: 'Runner', phone: '555-0300' },
    ],
    items: [
      {
        name: 'Tent',
        category: 'equipment',
        quantity: 2,
        status: 'pending',
      },
      {
        name: 'Water',
        category: 'food',
        quantity: 3,
        status: 'purchased',
      },
      {
        name: 'Bread',
        category: 'food',
        quantity: 2,
        status: 'pending',
      },
    ],
  });
}

function assignItemsToParticipants(plan: ReturnType<typeof buildTestPlan>) {
  const bob = plan.participants.find((p) => p.name === 'Bob')!;
  const carol = plan.participants.find((p) => p.name === 'Carol')!;
  const tent = plan.items.find((i) => i.name === 'Tent')!;
  const water = plan.items.find((i) => i.name === 'Water')!;
  tent.assignedParticipantId = bob.participantId;
  water.assignedParticipantId = carol.participantId;
  return plan;
}

test.describe('Plan creation via UI', () => {
  test('creates a plan with owner and navigates to detail page', async ({
    page,
  }) => {
    await mockPlansListRoutes(page);

    await page.goto('/plans');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: /create new plan/i }).click();
    await expect(page).toHaveURL(/\/create-plan/);

    await page.getByPlaceholder('Enter plan title').fill('E2E Test Trip');
    await page
      .getByPlaceholder('Add details about your plan')
      .fill('Automated test plan');

    await page.getByPlaceholder('First name').first().fill('Alex');
    await page.getByPlaceholder('Last name').first().fill('Test');
    await page.getByPlaceholder('Phone number').first().fill('555-0100');

    await page.getByLabel('One-day plan').check();
    await page.locator('input[type="date"]').fill('2026-07-15');

    await page.getByRole('button', { name: /create plan/i }).click();

    await expect(page).toHaveURL(/\/plan\//, { timeout: 15000 });
    await expect(page.getByText('E2E Test Trip')).toBeVisible();
    await expect(page.getByText('Alex Test').first()).toBeVisible();
  });
});

test.describe('Item CRUD', () => {
  test('adds items via UI and verifies they appear in categories', async ({
    page,
  }) => {
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('E2E Test Trip')).toBeVisible({
      timeout: 10000,
    });

    await addItemViaUI(page, 'Sleeping Bag', 1);
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Sleeping Bag' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('edits item quantity via form', async ({ page }) => {
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Edit Tent').click();
    const editForm = page.locator('form:has(button:text("Update Item"))');
    await expect(editForm).toBeVisible();
    await editForm.locator('input[type="number"]').fill('4');
    await editForm.getByRole('button', { name: 'Update Item' }).click();

    const tentCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Tent' });
    await expect(tentCard).toContainText('4');
  });

  test('changes item status inline', async ({ page }) => {
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Change status for Tent').click();
    await page.getByRole('option', { name: 'Purchased' }).click();

    const tentCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Tent' });
    await expect(tentCard.getByLabel('Change status for Tent')).toContainText(
      'Purchased'
    );
  });
});

test.describe('Filters', () => {
  test('participant filter shows correct items per person', async ({
    page,
  }) => {
    const plan = assignItemsToParticipants(buildTestPlan());
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });

    const participantFilter = page.locator(
      '[role="group"][aria-label="Filter by participant"]'
    );
    await expect(participantFilter).toBeVisible();

    await participantFilter
      .getByRole('button', { name: /Bob Helper/i })
      .click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeHidden();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeHidden();

    await participantFilter
      .getByRole('button', { name: /Unassigned/i })
      .click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeHidden();

    await participantFilter.getByRole('button', { name: /^All/i }).click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
  });

  test('status filter tabs show correct items per list', async ({ page }) => {
    const plan = assignItemsToParticipants(buildTestPlan());
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Tent')).toBeVisible({ timeout: 10000 });

    const statusTabs = page.locator(
      '[role="tablist"][aria-label="Filter items by list"]'
    );
    await statusTabs.scrollIntoViewIfNeeded();

    await statusTabs.locator('button', { hasText: 'Buying List' }).click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeHidden();

    await statusTabs.locator('button', { hasText: 'Packing List' }).click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeHidden();

    await statusTabs.locator('button', { hasText: /^All/ }).click();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
  });
});
