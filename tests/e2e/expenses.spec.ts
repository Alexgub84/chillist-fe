import {
  test,
  expect,
  buildPlan,
  buildExpense,
  mockPlanRoutes,
  mockExpenseRoutes,
  injectUserSession,
  type MockPlan,
  type MockExpense,
} from './fixtures';

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium only');
});

function buildExpenseTestPlan() {
  return buildPlan({
    title: 'Expenses E2E Plan',
    participants: [
      {
        name: 'Alex',
        lastName: 'Owner',
        phone: '555-0100',
        role: 'owner',
        userId: 'regular-user-id',
      },
      { name: 'Bob', lastName: 'Helper', phone: '555-0200' },
      { name: 'Carol', lastName: 'Runner', phone: '555-0300' },
    ],
    items: [
      { name: 'Tent', category: 'equipment', quantity: 1 },
      { name: 'Water', category: 'food', quantity: 6 },
    ],
  });
}

function seedExpenses(plan: MockPlan): MockExpense[] {
  const alex = plan.participants.find((p) => p.name === 'Alex')!;
  const bob = plan.participants.find((p) => p.name === 'Bob')!;

  return [
    buildExpense(plan.planId, {
      participantId: alex.participantId,
      amount: 150,
      description: 'Groceries',
      createdByUserId: 'regular-user-id',
    }),
    buildExpense(plan.planId, {
      participantId: bob.participantId,
      amount: 60,
      description: 'Gas',
      createdByUserId: 'regular-user-id',
    }),
  ];
}

async function setupExpensesPage(
  page: import('@playwright/test').Page,
  plan: MockPlan,
  expenses: MockExpense[]
) {
  await injectUserSession(page);
  await mockPlanRoutes(page, plan);
  await mockExpenseRoutes(page, plan, expenses);
  await page.goto(`/expenses/${plan.planId}`);
}

test.describe('Expenses page', () => {
  test('displays pre-seeded expense entries', async ({ page }) => {
    const plan = buildExpenseTestPlan();
    const expenses = seedExpenses(plan);
    await setupExpensesPage(page, plan, expenses);

    for (const expense of expenses) {
      const card = page.getByTestId(`expense-card-${expense.expenseId}`);
      await expect(card).toBeVisible({ timeout: 15000 });
      await expect(card).toContainText(parseFloat(expense.amount).toFixed(2));
      if (expense.description) {
        await expect(card).toContainText(expense.description);
      }
    }

    const alexCard = page.getByTestId(`expense-card-${expenses[0].expenseId}`);
    await expect(alexCard).toContainText('Alex Owner');

    const bobCard = page.getByTestId(`expense-card-${expenses[1].expenseId}`);
    await expect(bobCard).toContainText('Bob Helper');
  });

  test('shows correct per-participant summary and grand total', async ({
    page,
  }) => {
    const plan = buildExpenseTestPlan();
    const expenses = seedExpenses(plan);
    await setupExpensesPage(page, plan, expenses);

    const summary = page.getByTestId('expenses-summary');
    await expect(summary).toBeVisible({ timeout: 15000 });

    await expect(summary).toContainText('150.00');
    await expect(summary).toContainText('60.00');

    const totalRow = page.getByTestId('summary-total');
    await expect(totalRow).toContainText('210.00');
  });

  test('calculates settlement correctly', async ({ page }) => {
    const plan = buildExpenseTestPlan();
    const expenses = seedExpenses(plan);
    await setupExpensesPage(page, plan, expenses);

    const settlementCard = page.getByTestId('settlement-card');
    await expect(settlementCard).toBeVisible({ timeout: 15000 });

    const fairShare = page.getByTestId('settlement-fair-share');
    await expect(fairShare).toContainText('70.00');

    const alex = plan.participants.find((p) => p.name === 'Alex')!;
    const bob = plan.participants.find((p) => p.name === 'Bob')!;
    const carol = plan.participants.find((p) => p.name === 'Carol')!;

    const alexBalance = page.getByTestId(
      `settlement-balance-${alex.participantId}`
    );
    await expect(alexBalance).toContainText('+80.00');

    const bobBalance = page.getByTestId(
      `settlement-balance-${bob.participantId}`
    );
    await expect(bobBalance).toContainText('-10.00');

    const carolBalance = page.getByTestId(
      `settlement-balance-${carol.participantId}`
    );
    await expect(carolBalance).toContainText('-70.00');

    const transfer0 = page.getByTestId('settlement-transfer-0');
    await expect(transfer0).toContainText('Carol Runner');
    await expect(transfer0).toContainText('Alex Owner');
    await expect(transfer0).toContainText('70.00');

    const transfer1 = page.getByTestId('settlement-transfer-1');
    await expect(transfer1).toContainText('Bob Helper');
    await expect(transfer1).toContainText('Alex Owner');
    await expect(transfer1).toContainText('10.00');
  });

  test('adds expense and summary updates', async ({ page }) => {
    const plan = buildExpenseTestPlan();
    const expenses = seedExpenses(plan);
    await setupExpensesPage(page, plan, expenses);

    await expect(page.getByTestId('summary-total')).toContainText('210.00', {
      timeout: 15000,
    });

    await page.getByTestId('add-expense-btn').click();
    const modal = page.getByTestId('add-expense-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const carol = plan.participants.find((p) => p.name === 'Carol')!;
    const form = modal.locator('form');

    await form.locator('select').selectOption(carol.participantId);
    await form.locator('input[type="number"]').fill('90');
    await form.locator('#description').fill('Camping gear');

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/expenses') && r.request().method() === 'POST'
      ),
      form.getByTestId('expense-form-submit').click(),
    ]);

    await expect(modal).toBeHidden({ timeout: 10000 });

    await expect(page.getByTestId('summary-total')).toContainText('300.00', {
      timeout: 10000,
    });

    await expect(page.getByText('Camping gear')).toBeVisible({
      timeout: 5000,
    });
  });

  test('deletes expense and summary updates', async ({ page }) => {
    const plan = buildExpenseTestPlan();
    const expenses = seedExpenses(plan);
    await setupExpensesPage(page, plan, expenses);

    const bobExpense = expenses[1];
    await expect(
      page.getByTestId(`expense-card-${bobExpense.expenseId}`)
    ).toBeVisible({ timeout: 15000 });

    await page.getByTestId(`delete-expense-${bobExpense.expenseId}`).click();

    const deleteModal = page.getByTestId('delete-expense-modal');
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/expenses/') && r.request().method() === 'DELETE'
      ),
      page.getByTestId('confirm-delete-expense').click(),
    ]);

    await expect(deleteModal).toBeHidden({ timeout: 10000 });

    await expect(
      page.getByTestId(`expense-card-${bobExpense.expenseId}`)
    ).toBeHidden({ timeout: 10000 });

    await expect(page.getByTestId('summary-total')).toContainText('150.00', {
      timeout: 10000,
    });
  });
});
