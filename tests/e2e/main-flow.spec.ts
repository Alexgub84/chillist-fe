import {
  test,
  expect,
  type Page,
  buildPlan,
  mockPlanRoutes,
  mockPlansListRoutes,
  mockInviteRoute,
  injectUserSession,
} from './fixtures';

async function addItemViaUI(
  page: Page,
  name: string,
  quantity: number
): Promise<void> {
  await page.getByRole('button', { name: /Add Item/i }).click();

  const form = page.locator('form:has(button[type="submit"])').last();
  await expect(form).toBeVisible();

  const nameInput = form.getByPlaceholder('Item name');
  await nameInput.fill(name);
  const option = page.getByRole('option', { name, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click({ force: true });

  const quantityInput = form.locator('input[type="number"]');
  await quantityInput.fill(String(quantity));

  const submitBtn = form.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible();
  await submitBtn.click({ force: true });
  await expect(form).toBeHidden({ timeout: 10000 });
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
    await injectUserSession(page);
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

    await page
      .getByRole('button', { name: /skip for now/i })
      .click({ timeout: 15000 });

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
    const updateBtn = editForm.getByRole('button', { name: 'Update Item' });
    await expect(updateBtn).toBeVisible();
    await updateBtn.click({ force: true });
    await expect(editForm).toBeHidden({ timeout: 10000 });

    const tentCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Tent' });
    await expect(tentCard).toContainText('4');
  });

  test('edits all item fields via modal form', async ({ page }) => {
    const plan = buildTestPlan();
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Bread')).toBeVisible({ timeout: 10000 });

    await page.getByLabel('Edit Bread').click();
    const editForm = page.locator('form:has(button:text("Update Item"))');
    await expect(editForm).toBeVisible();

    const nameInput = editForm.getByPlaceholder('Item name');
    await nameInput.clear();
    await nameInput.fill('Granola');
    await nameInput.press('Escape');

    await editForm.locator('input[type="number"]').fill('5');
    await editForm.locator('select[name="unit"]').selectOption('kg');
    await editForm.locator('select[name="status"]').selectOption('purchased');
    await editForm.locator('textarea').fill('Organic whole grain');
    await editForm
      .locator('select[name="assignedParticipantId"]')
      .selectOption({ label: 'Bob Helper' });

    const updateAllBtn = editForm.getByRole('button', { name: 'Update Item' });
    await expect(updateAllBtn).toBeVisible();
    await updateAllBtn.click({ force: true });
    await expect(editForm).toBeHidden({ timeout: 10000 });

    const itemCard = page
      .locator('[class*="border-l-"]')
      .filter({ hasText: 'Granola' });
    await expect(itemCard).toBeVisible({ timeout: 5000 });
    await expect(itemCard).toContainText('5');
    await expect(itemCard).toContainText('Kilogram');
    await expect(itemCard).toContainText('Purchased');
    await expect(itemCard).toContainText('Organic whole grain');
    await expect(itemCard).toContainText('Bob Helper');
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

test.describe('Edit Plan', () => {
  test('owner can edit plan title via edit modal', async ({ page }) => {
    await injectUserSession(page);

    const plan = buildPlan({
      title: 'Original Trip Name',
      participants: [
        {
          name: 'Regular',
          lastName: 'User',
          phone: '555-0100',
          role: 'owner',
          userId: 'regular-user-id',
        },
        { name: 'Bob', lastName: 'Helper', phone: '555-0200' },
      ],
      items: [{ name: 'Tent', category: 'equipment', quantity: 1 }],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Original Trip Name')).toBeVisible({
      timeout: 10000,
    });

    const editBtn = page.getByTestId('edit-plan-button');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const editForm = page.locator('form').last();
    await expect(editForm).toBeVisible();

    const titleInput = editForm.getByPlaceholder('Enter plan title');
    await expect(titleInput).toHaveValue('Original Trip Name');
    await titleInput.clear();
    await titleInput.fill('Updated Trip Name');

    const submitBtn = editForm.getByRole('button', { name: /update plan/i });
    await expect(submitBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'PATCH'),
      submitBtn.click(),
    ]);
    await expect(editForm).toBeHidden({ timeout: 10000 });

    await expect(page.getByText('Updated Trip Name')).toBeVisible({
      timeout: 5000,
    });
  });

  test('non-owner cannot see edit button', async ({ page }) => {
    await injectUserSession(page);

    const plan = buildPlan({
      title: 'Someone Else Plan',
      participants: [
        {
          name: 'Other',
          lastName: 'Owner',
          phone: '555-0100',
          role: 'owner',
          userId: 'different-user-id',
        },
        { name: 'Bob', lastName: 'Helper', phone: '555-0200' },
      ],
      items: [{ name: 'Tent', category: 'equipment', quantity: 1 }],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Someone Else Plan')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByTestId('edit-plan-button')).toBeHidden();
  });

  test('unauthenticated user cannot see edit button', async ({ page }) => {
    const plan = buildPlan({
      title: 'Public Plan',
      participants: [
        {
          name: 'Owner',
          lastName: 'User',
          phone: '555-0100',
          role: 'owner',
          userId: 'some-user-id',
        },
      ],
      items: [],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Public Plan')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByTestId('edit-plan-button')).toBeHidden();
  });
});

test.describe('Participant Preferences Access', () => {
  test('owner can see edit buttons on participant preferences', async ({
    page,
  }) => {
    await injectUserSession(page);

    const plan = buildPlan({
      title: 'Owner Plan',
      participants: [
        {
          name: 'Regular',
          lastName: 'User',
          phone: '555-0100',
          role: 'owner',
          userId: 'regular-user-id',
        },
        {
          name: 'Guest',
          lastName: 'Person',
          phone: '555-0200',
          adultsCount: 2,
        },
      ],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Owner Plan')).toBeVisible({ timeout: 10000 });

    const detailsSection = page.getByText('Group Details').locator('..');
    await expect(detailsSection.getByText('Edit').first()).toBeVisible();
  });

  test('non-owner cannot see edit buttons on participant preferences', async ({
    page,
  }) => {
    await injectUserSession(page);

    const plan = buildPlan({
      title: 'Other Plan',
      participants: [
        {
          name: 'Other',
          lastName: 'Owner',
          phone: '555-0100',
          role: 'owner',
          userId: 'different-user-id',
        },
        {
          name: 'Guest',
          lastName: 'Person',
          phone: '555-0200',
          adultsCount: 2,
        },
      ],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Other Plan')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Group Details')).toBeVisible();
    await expect(page.getByText('Guest Person')).toBeVisible();

    const editButtons = page
      .locator('text=Group Details')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'Edit' });
    await expect(editButtons).toHaveCount(0);
  });

  test('unauthenticated user cannot see edit buttons on participant preferences', async ({
    page,
  }) => {
    const plan = buildPlan({
      title: 'Public View Plan',
      participants: [
        {
          name: 'Owner',
          lastName: 'User',
          phone: '555-0100',
          role: 'owner',
          userId: 'some-user-id',
          adultsCount: 1,
        },
        {
          name: 'Guest',
          lastName: 'Person',
          phone: '555-0200',
          adultsCount: 2,
        },
      ],
    });
    await mockPlanRoutes(page, plan);

    await page.goto(`/plan/${plan.planId}`);
    await expect(page.getByText('Public View Plan')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Group Details')).toBeVisible();

    const editButtons = page
      .locator('text=Group Details')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'Edit' });
    await expect(editButtons).toHaveCount(0);
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

test.describe('Invite Landing Page', () => {
  test('shows plan details for valid invite link', async ({ page }) => {
    const plan = buildPlan({
      title: 'Beach BBQ',
      participants: [
        { name: 'Alex', lastName: 'Smith', phone: '555-0100', role: 'owner' },
        { name: 'Bob', lastName: 'Jones', phone: '555-0200' },
      ],
      items: [
        { name: 'Sunscreen', category: 'equipment', quantity: 2 },
        { name: 'Burgers', category: 'food', quantity: 10 },
      ],
    });

    const inviteToken = plan.participants[1].inviteToken!;
    await mockInviteRoute(page, plan, inviteToken);

    await page.goto(`/invite/${plan.planId}/${inviteToken}`);

    await expect(page.getByText('Beach BBQ')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("You're Invited!")).toBeVisible();

    await expect(page.getByText('Sunscreen')).toBeVisible();
    await expect(page.getByText('Burgers')).toBeVisible();

    await expect(page.getByText('Alex Smith')).toBeVisible();
    await expect(page.getByText('Bob Jones')).toBeVisible();
  });

  test('shows error for invalid invite token', async ({ page }) => {
    const API_PATTERN = '**/localhost:3333';
    await page.route(
      `${API_PATTERN}/plans/*/invite/bad-token`,
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          json: { message: 'Invalid or expired invite link' },
        });
      }
    );

    await page.goto('/invite/some-plan-id/bad-token');

    await expect(
      page.getByText('This invite link is invalid or has expired.')
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Go to homepage')).toBeVisible();
  });

  test('shows sign-in and sign-up links when not authenticated', async ({
    page,
  }) => {
    const plan = buildPlan({
      title: 'Hiking Trip',
      participants: [
        { name: 'Owner', lastName: 'User', phone: '555-0100', role: 'owner' },
        { name: 'Guest', lastName: 'User', phone: '555-0200' },
      ],
    });

    const inviteToken = plan.participants[1].inviteToken!;
    await mockInviteRoute(page, plan, inviteToken);
    await page.goto(`/invite/${plan.planId}/${inviteToken}`);

    await expect(page.getByText('Hiking Trip')).toBeVisible({ timeout: 10000 });

    const signInLink = page.getByRole('link', {
      name: /sign in to join/i,
    });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute(
      'href',
      expect.stringContaining(`/signin?redirect=%2Fplan%2F${plan.planId}`)
    );

    const signUpLink = page.getByRole('link', {
      name: /or create an account/i,
    });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute(
      'href',
      expect.stringContaining(`/signup?redirect=%2Fplan%2F${plan.planId}`)
    );
  });

  test('shows "Go to plan" link when authenticated', async ({ page }) => {
    const plan = buildPlan({
      title: 'Camping Trip',
      participants: [
        { name: 'Owner', lastName: 'User', phone: '555-0100', role: 'owner' },
        { name: 'Guest', lastName: 'User', phone: '555-0200' },
      ],
    });

    const inviteToken = plan.participants[1].inviteToken!;
    await injectUserSession(page);
    await mockInviteRoute(page, plan, inviteToken);
    await page.goto(`/invite/${plan.planId}/${inviteToken}`);

    await expect(page.getByText('Camping Trip')).toBeVisible({
      timeout: 10000,
    });

    const goToPlanLink = page.getByRole('link', { name: /go to plan/i });
    await expect(goToPlanLink).toBeVisible();
    await expect(goToPlanLink).toHaveAttribute('href', `/plan/${plan.planId}`);

    await expect(
      page.getByRole('link', { name: /sign in to join/i })
    ).not.toBeVisible();
  });

  test('sign-in link redirects to plan page after authentication', async ({
    page,
  }) => {
    const plan = buildPlan({
      title: 'Day Out',
      participants: [
        { name: 'Owner', lastName: 'User', phone: '555-0100', role: 'owner' },
        { name: 'Guest', lastName: 'User', phone: '555-0200' },
      ],
    });

    const inviteToken = plan.participants[1].inviteToken!;
    await mockInviteRoute(page, plan, inviteToken);
    await page.goto(`/invite/${plan.planId}/${inviteToken}`);

    await expect(page.getByText('Day Out')).toBeVisible({ timeout: 10000 });

    const signInLink = page.getByRole('link', { name: /sign in to join/i });
    await signInLink.click();

    await page.waitForURL(/\/signin/);
    expect(page.url()).toContain(`redirect=%2Fplan%2F${plan.planId}`);
  });
});
