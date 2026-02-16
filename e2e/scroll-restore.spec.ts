import { test, expect } from './fixtures';

const MOCK_API = 'http://localhost:3333';

async function seedPlanWithItems(count: number): Promise<string> {
  const res = await fetch(`${MOCK_API}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Scroll Test Trip',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-03T00:00:00.000Z',
    }),
  });
  const plan = (await res.json()) as { planId: string };

  for (let i = 1; i <= count; i++) {
    await fetch(`${MOCK_API}/plans/${plan.planId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Item ${String(i).padStart(2, '0')}`,
        category: i <= Math.ceil(count / 2) ? 'equipment' : 'food',
        quantity: i,
        unit: 'pcs',
        status: 'pending',
        notes: `Notes for item ${i}`,
      }),
    });
  }

  return plan.planId;
}

function isInViewport(
  box: { y: number; height: number },
  viewportHeight: number
): boolean {
  return box.y + box.height > 0 && box.y < viewportHeight;
}

test.describe('Scroll restoration on browser refresh', () => {
  test('restores to the correct item after refresh (desktop)', async ({
    page,
  }) => {
    const planId = await seedPlanWithItems(20);

    await page.goto(`/plan/${planId}`);
    const allItems = page.locator('[data-scroll-item-id]');
    await expect(allItems.first()).toBeVisible({ timeout: 10000 });

    const targetItem = allItems.nth(14);
    const targetId = await targetItem.getAttribute('data-scroll-item-id');
    const firstId = await allItems.first().getAttribute('data-scroll-item-id');

    await targetItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await page.reload();
    await expect(allItems.first()).toBeVisible({ timeout: 10000 });

    const target = page.locator(`[data-scroll-item-id="${targetId}"]`);
    await expect(target).toBeInViewport({ timeout: 5000 });

    const viewport = page.viewportSize()!;
    const targetBox = await target.boundingBox();
    expect(
      targetBox,
      `Target item (index 14) should have a bounding box`
    ).toBeTruthy();
    expect(
      isInViewport(targetBox!, viewport.height),
      `Target item top=${targetBox!.y} should be within viewport height=${viewport.height}`
    ).toBe(true);

    const firstBox = await page
      .locator(`[data-scroll-item-id="${firstId}"]`)
      .boundingBox();
    expect(firstBox, 'First item should exist').toBeTruthy();
    expect(
      isInViewport(firstBox!, viewport.height),
      `First item top=${firstBox!.y} should NOT be in viewport`
    ).toBe(false);
  });

  test('restores to the correct item after refresh (mobile)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const planId = await seedPlanWithItems(20);

    await page.goto(`/plan/${planId}`);
    const allItems = page.locator('[data-scroll-item-id]');
    await expect(allItems.first()).toBeVisible({ timeout: 10000 });

    const targetItem = allItems.nth(14);
    const targetId = await targetItem.getAttribute('data-scroll-item-id');
    const firstId = await allItems.first().getAttribute('data-scroll-item-id');

    await targetItem.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await page.reload();
    await expect(allItems.first()).toBeVisible({ timeout: 10000 });

    const target = page.locator(`[data-scroll-item-id="${targetId}"]`);
    await expect(target).toBeInViewport({ timeout: 5000 });

    const viewport = page.viewportSize()!;
    const targetBox = await target.boundingBox();
    expect(
      targetBox,
      `Target item (index 14) should have a bounding box`
    ).toBeTruthy();
    expect(
      isInViewport(targetBox!, viewport.height),
      `Target item top=${targetBox!.y} should be within viewport height=${viewport.height}`
    ).toBe(true);

    const firstBox = await page
      .locator(`[data-scroll-item-id="${firstId}"]`)
      .boundingBox();
    expect(firstBox, 'First item should exist').toBeTruthy();
    expect(
      isInViewport(firstBox!, viewport.height),
      `First item top=${firstBox!.y} should NOT be in viewport`
    ).toBe(false);
  });
});
