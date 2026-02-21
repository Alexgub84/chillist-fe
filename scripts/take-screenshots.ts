/**
 * Home Page Screenshot Generator
 *
 * Captures mobile (iPhone 13) screenshots of the app for the "How it works"
 * section on the home page (src/routes/index.lazy.tsx).
 *
 * Prerequisites:
 *   1. Mock server running: npm run mock:server
 *   2. Dev server running:  npm run dev
 *   3. Mock data must have at least one plan with items (api/mock-data.json)
 *
 * Run:
 *   npm run screenshots
 *
 * Output (saved to public/):
 *   step-1.png    — Create Plan form (EN)     → "Create a plan" step card
 *   step-2.png    — Items list, All tab (EN)  → "Add your gear and food" step card
 *   step-3.png    — Buying List filter (EN)   → "Track together" step card
 *   step-1-he.png — Create Plan form (HE)     → Hebrew version of step 1
 *   step-2-he.png — Items list, All tab (HE)  → Hebrew version of step 2
 *   step-3-he.png — Buying List filter (HE)   → Hebrew version of step 3
 *
 * The hero image (public/hero.jpg) is a static photo, not generated here.
 *
 * When to re-run:
 *   - After UI changes to the Create Plan form, plan detail, or items section
 *   - After changing the layout/styling of those pages
 *   - After updating mock data that affects what appears in screenshots
 *   - After updating translations that appear in screenshots
 */

import { chromium, devices, type Page } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'public';
const device = devices['iPhone 13'];

async function setLanguage(page: Page, lang: string) {
  await page.evaluate((l) => localStorage.setItem('chillist-lang', l), lang);
}

async function scrollToItems(page: Page) {
  const heading = page
    .locator('h2:has-text("Items"), h2:has-text("פריטים")')
    .first();
  if (await heading.isVisible().catch(() => false)) {
    const box = await heading.boundingBox();
    if (box) {
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.evaluate(
        (top) => window.scrollTo(0, top - 8),
        box.y + scrollY
      );
    }
    await page.waitForTimeout(300);
  }
}

async function captureSteps(page: Page, lang: string, suffix: string) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await setLanguage(page, lang);
  await page.goto(`${BASE}/create-plan`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/step-1${suffix}.png` });
  console.log(`step-1${suffix}.png — Create Plan form`);

  await page.goto(`${BASE}/plans`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const planLink = page.locator('a[href*="/plan/"]').first();
  if (!(await planLink.isVisible().catch(() => false))) {
    console.log('No plans found — make sure the mock server has data');
    return;
  }

  await planLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  await scrollToItems(page);
  await page.screenshot({ path: `${OUT}/step-2${suffix}.png` });
  console.log(`step-2${suffix}.png — Items list`);

  const buyingTab = page
    .locator('button:has-text("Buying List"), button:has-text("רשימת קניות")')
    .first();
  if (await buyingTab.isVisible().catch(() => false)) {
    await buyingTab.click();
    await page.waitForTimeout(500);
  }
  await scrollToItems(page);
  await page.screenshot({ path: `${OUT}/step-3${suffix}.png` });
  console.log(`step-3${suffix}.png — Buying list`);
}

async function main() {
  const browser = await chromium.launch();

  const enContext = await browser.newContext({ ...device });
  const enPage = await enContext.newPage();
  console.log('\n— English —');
  await captureSteps(enPage, 'en', '');
  await enContext.close();

  const heContext = await browser.newContext({ ...device });
  const hePage = await heContext.newPage();
  console.log('\n— Hebrew —');
  await captureSteps(hePage, 'he', '-he');
  await heContext.close();

  await browser.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
