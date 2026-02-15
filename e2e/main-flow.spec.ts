import { test, expect, type Page } from './fixtures';

async function addItem(
  page: Page,
  name: string,
  quantity: number
): Promise<void> {
  await page.getByRole('button', { name: /^\+\s*Add Item$/i }).click();

  const form = page.locator('form:has(button[type="submit"])').last();
  await expect(form).toBeVisible();

  const nameInput = form.getByPlaceholder('Item name');
  await nameInput.fill(name);
  await page
    .getByRole('option', { name, exact: true })
    .click({ timeout: 5000 });

  const quantityInput = form.locator('input[type="number"]');
  await quantityInput.fill(String(quantity));

  await form.locator('button[type="submit"]').click();
  await expect(form).toBeHidden({ timeout: 5000 });
}

test.describe('Main flow: plan creation, items, participants, filters', () => {
  test('full lifecycle from plan creation to filtered item views', async ({
    page,
  }) => {
    // ── Phase 1: Navigate to plans list ─────────────────────────────────
    await page.goto('/plans');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    // ── Phase 2: Create a new plan ──────────────────────────────────────
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

    // Verify redirect to plan detail
    await expect(page).toHaveURL(/\/plan\//, { timeout: 15000 });
    await expect(page.getByText('E2E Test Trip')).toBeVisible();
    await expect(page.getByText('Alex Test').first()).toBeVisible();

    // ── Phase 3: Add participants ───────────────────────────────────────
    // Add participant 1: Bob Helper
    await page.getByRole('button', { name: /^\+\s*Add Participant$/i }).click();

    const participantForm1 = page.locator(
      'form:has(button:text("Add Participant"))'
    );
    await participantForm1.getByPlaceholder('First name').fill('Bob');
    await participantForm1.getByPlaceholder('Last name').fill('Helper');
    await participantForm1.getByPlaceholder('Phone number').fill('555-0200');
    await participantForm1
      .getByRole('button', { name: 'Add Participant' })
      .click();

    await expect(page.getByText('Bob Helper')).toBeVisible({ timeout: 5000 });

    // Add participant 2: Carol Runner
    await page.getByRole('button', { name: /^\+\s*Add Participant$/i }).click();

    const participantForm2 = page.locator(
      'form:has(button:text("Add Participant"))'
    );
    await participantForm2.getByPlaceholder('First name').fill('Carol');
    await participantForm2.getByPlaceholder('Last name').fill('Runner');
    await participantForm2.getByPlaceholder('Phone number').fill('555-0300');
    await participantForm2
      .getByRole('button', { name: 'Add Participant' })
      .click();

    await expect(page.getByText('Carol Runner')).toBeVisible({ timeout: 5000 });

    // Verify participant count shows (3): owner + 2 added
    await expect(
      page.locator('h2:has-text("Participants")').getByText('(3)')
    ).toBeVisible();

    // ── Phase 4: Add items ──────────────────────────────────────────────
    // Add equipment item: Tent (qty 2)
    await addItem(page, 'Tent', 2);

    await expect(page.locator('h3', { hasText: 'Equipment' })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();

    // Add food item: Water (qty 3)
    await addItem(page, 'Water', 3);

    await expect(page.locator('h3', { hasText: 'Food' })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();

    // Add another food item: Bread (qty 2)
    await addItem(page, 'Bread', 2);

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible({ timeout: 5000 });

    // Verify items count shows (3)
    await expect(
      page.locator('h2:has-text("Items")').getByText('(3)')
    ).toBeVisible();

    // ── Phase 5: Edit item via full form ────────────────────────────────
    await page.getByLabel('Edit Tent').click();

    const editForm = page.locator('form:has(button:text("Update Item"))');
    await expect(editForm).toBeVisible();
    await editForm.locator('input[type="number"]').fill('4');
    await editForm.getByRole('button', { name: 'Update Item' }).click();

    // Verify quantity updated (look for "4" in the Tent item row)
    const tentCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Tent' });
    await expect(tentCard).toContainText('4');

    // ── Phase 6: Inline status change ───────────────────────────────────
    // Change Water status from Pending to Purchased
    await page.getByLabel('Change status for Water').click();
    await page.getByRole('option', { name: 'Purchased' }).click();

    // Verify status updated on the Water card
    const waterCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Water' });
    await expect(waterCard.getByLabel('Change status for Water')).toContainText(
      'Purchased'
    );

    // ── Phase 7: Inline assignment changes ──────────────────────────────
    // Assign Tent to Bob Helper
    await page.getByLabel('Assign Tent to participant').click();
    await page.getByRole('option', { name: 'Bob Helper' }).click();

    await expect(
      tentCard.getByLabel('Assign Tent to participant')
    ).toContainText('Bob Helper');

    // Assign Water to Carol Runner
    await page.getByLabel('Assign Water to participant').click();
    await page.getByRole('option', { name: 'Carol Runner' }).click();

    await expect(
      waterCard.getByLabel('Assign Water to participant')
    ).toContainText('Carol Runner');

    // ── Phase 8: Participant filter ─────────────────────────────────────
    // Participant filter should be visible now
    const participantFilterGroup = page.locator(
      '[role="group"][aria-label="Filter by participant"]'
    );
    await expect(participantFilterGroup).toBeVisible();

    // Filter by Bob Helper — only Tent should be visible
    await participantFilterGroup
      .getByRole('button', { name: /Bob Helper/i })
      .click();

    await expect(tentCard).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeHidden();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeHidden();

    // Filter by Unassigned — only Bread should be visible
    await participantFilterGroup
      .getByRole('button', { name: /Unassigned/i })
      .click();

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeHidden();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeHidden();

    // Reset to All
    await participantFilterGroup.getByRole('button', { name: /^All/i }).click();

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();

    // ── Phase 9: Status filter tabs ─────────────────────────────────────
    const statusTabs = page.locator(
      '[role="tablist"][aria-label="Filter items by list"]'
    );

    // Buying List — pending items: Tent and Bread (Water is Purchased)
    // Use hasText instead of getByRole name — tab labels are hidden on mobile
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

    // Packing List — purchased items: Water only
    await statusTabs.locator('button', { hasText: 'Packing List' }).click();

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeHidden();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeHidden();

    // Assigning List — unassigned items: Bread only
    await statusTabs.locator('button', { hasText: 'Assigning List' }).click();

    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Bread' })
    ).toBeVisible();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Tent' })
    ).toBeHidden();
    await expect(
      page.locator('[class*="border-l-"]').filter({ hasText: 'Water' })
    ).toBeHidden();

    // All — reset
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

    // ── Phase 10: Navigate back to plans list ───────────────────────────
    await page.getByRole('link', { name: /back to plans/i }).click();
    await expect(page).toHaveURL(/\/plans/);
    await expect(page.getByText('E2E Test Trip')).toBeVisible({
      timeout: 15000,
    });
  });
});
