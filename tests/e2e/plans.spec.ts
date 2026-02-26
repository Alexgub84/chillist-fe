import {
  test,
  expect,
  buildPlan,
  mockPlansListRoutes,
  injectAdminSession,
  injectUserSession,
} from './fixtures';

const API_PLANS_URL = '**/localhost:3333/plans';

test.describe('Plans Page', () => {
  test('displays plans successfully when API returns data', async ({
    page,
  }) => {
    await injectUserSession(page);
    const plan = buildPlan({ title: 'Beach Trip' });
    await mockPlansListRoutes(page, [plan]);

    await page.goto('/plans');

    const plansContainer = page.locator('main');
    await expect(plansContainer).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Beach Trip')).toBeVisible();
  });

  test('displays user-friendly error when API fails', async ({ page }) => {
    await injectUserSession(page);
    await page.route(API_PLANS_URL, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/plans');

    await expect(page.getByText('Server Error')).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByText(/Something went wrong on our end/)
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('displays connection error when network fails', async ({ page }) => {
    await injectUserSession(page);
    await page.route(API_PLANS_URL, (route) => {
      route.abort('failed');
    });

    await page.goto('/plans');

    await expect(page.getByText('Connection Problem')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('displays config error when API returns HTML', async ({ page }) => {
    await injectUserSession(page);
    await page.route(API_PLANS_URL, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><body>Not Found</body></html>',
      });
    });

    await page.goto('/plans');

    await expect(page.getByText('Server Configuration Error')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
});

test.describe('Admin Delete', () => {
  test('admin user sees delete buttons on every plan card', async ({
    page,
  }) => {
    const plan1 = buildPlan({ title: 'Beach Trip' });
    const plan2 = buildPlan({ title: 'Mountain Hike' });

    await injectAdminSession(page);
    await mockPlansListRoutes(page, [plan1, plan2]);

    await page.goto('/plans');

    await expect(page.getByText('Beach Trip')).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByTestId(`admin-delete-${plan1.planId}`)
    ).toBeVisible();
    await expect(
      page.getByTestId(`admin-delete-${plan2.planId}`)
    ).toBeVisible();
  });

  test('non-admin user does NOT see delete buttons', async ({ page }) => {
    const plan1 = buildPlan({ title: 'Beach Trip' });
    const plan2 = buildPlan({ title: 'Mountain Hike' });

    await injectUserSession(page);
    await mockPlansListRoutes(page, [plan1, plan2]);

    await page.goto('/plans');

    await expect(page.getByText('Beach Trip')).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId(`admin-delete-${plan1.planId}`)).toBeHidden();
    await expect(page.getByTestId(`admin-delete-${plan2.planId}`)).toBeHidden();
  });

  test('unauthenticated user sees sign-in prompt instead of plans', async ({
    page,
  }) => {
    await mockPlansListRoutes(page, []);

    await page.goto('/plans');

    await expect(page.getByText('My Plans')).toBeVisible({ timeout: 15000 });
    const main = page.getByRole('main');
    await expect(
      main.getByText('Sign in to create and manage plans')
    ).toBeVisible();
  });

  test('admin can delete a plan via confirmation modal', async ({ page }) => {
    const plan1 = buildPlan({ title: 'Beach Trip' });
    const plan2 = buildPlan({ title: 'Mountain Hike' });

    await injectAdminSession(page);
    await mockPlansListRoutes(page, [plan1, plan2]);

    await page.goto('/plans');

    await expect(page.getByText('Beach Trip')).toBeVisible({ timeout: 15000 });

    await page.getByTestId(`admin-delete-${plan1.planId}`).click();

    await expect(page.getByText('Delete Plan?')).toBeVisible({
      timeout: 10000,
    });
    const confirmBtn = page.getByTestId('admin-delete-confirm');
    await expect(confirmBtn).toBeVisible();
    await expect(confirmBtn).toBeEnabled();

    await page.waitForTimeout(300);

    await confirmBtn.click({ force: true });

    await expect(page.getByText('Delete Plan?')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Plan deleted')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Mountain Hike')).toBeVisible();
  });

  test('admin can cancel delete via modal', async ({ page }) => {
    const plan = buildPlan({ title: 'Beach Trip' });

    await injectAdminSession(page);
    await mockPlansListRoutes(page, [plan]);

    await page.goto('/plans');

    await expect(page.getByText('Beach Trip')).toBeVisible({ timeout: 15000 });

    await page.getByTestId(`admin-delete-${plan.planId}`).click();

    await expect(page.getByText('Delete Plan?')).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId('admin-delete-cancel').click();

    await expect(page.getByText('Delete Plan?')).toBeHidden({
      timeout: 10000,
    });
    await expect(page.getByText('Beach Trip')).toBeVisible();
  });
});

test.describe('Membership Filter', () => {
  test('user can filter plans by owned and invited', async ({ page }) => {
    const userId = 'regular-user-id';
    const ownedPlan = buildPlan({
      title: 'My Camping Trip',
      participants: [{ name: 'Alex', lastName: 'G', role: 'owner', userId }],
    });
    const invitedPlan = buildPlan({
      title: 'Friend Picnic',
      participants: [
        { name: 'Jamie', lastName: 'R', role: 'owner' },
        { name: 'Alex', lastName: 'G', role: 'participant', userId },
      ],
    });

    await injectUserSession(page);
    await mockPlansListRoutes(page, [ownedPlan, invitedPlan]);

    await page.goto('/plans');

    await expect(page.getByText('My Camping Trip')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Friend Picnic')).toBeVisible();

    await expect(page.getByTestId('membership-filter-all')).toBeVisible();
    await expect(page.getByTestId('membership-filter-owned')).toBeVisible();
    await expect(page.getByTestId('membership-filter-invited')).toBeVisible();

    await page.getByTestId('membership-filter-owned').click();
    await expect(page.getByText('My Camping Trip')).toBeVisible();
    await expect(page.getByText('Friend Picnic')).toBeHidden();

    await page.getByTestId('membership-filter-invited').click();
    await expect(page.getByText('Friend Picnic')).toBeVisible();
    await expect(page.getByText('My Camping Trip')).toBeHidden();

    await page.getByTestId('membership-filter-all').click();
    await expect(page.getByText('My Camping Trip')).toBeVisible();
    await expect(page.getByText('Friend Picnic')).toBeVisible();
  });
});

test.describe('Plans List Auth CTA', () => {
  test('signed-in user sees "Create New Plan" link', async ({ page }) => {
    await injectUserSession(page);
    await mockPlansListRoutes(page, []);

    await page.goto('/plans');
    await expect(page.getByText('My Plans')).toBeVisible({ timeout: 15000 });

    const createLink = page.getByRole('link', { name: /create new plan/i });
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute('href', '/create-plan');

    await expect(
      page.getByText('Sign in to create and manage plans')
    ).not.toBeVisible();
  });

  test('unauthenticated user sees sign-in and sign-up buttons instead of create', async ({
    page,
  }) => {
    await mockPlansListRoutes(page, []);

    await page.goto('/plans');
    await expect(page.getByText('My Plans')).toBeVisible({ timeout: 15000 });

    const main = page.getByRole('main');

    await expect(
      main.getByText('Sign in to create and manage plans')
    ).toBeVisible();

    const signInLink = main.getByRole('link', { name: 'Sign In' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/signin');

    const signUpLink = main.getByRole('link', { name: 'Sign Up' });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/signup');

    await expect(
      main.getByRole('link', { name: /create new plan/i })
    ).not.toBeVisible();
  });
});
