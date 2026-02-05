# Dev Lessons

A log of bugs fixed and problems solved in this project.

---

<!-- Add new entries at the top -->

## 2026-02-05: E2E Testing Best Practices

**Problem**: Playwright E2E tests were flaky - checking for "Loading..." state was unreliable because data loads too fast.

**Root Cause**: Loading states are transient and timing-dependent. In E2E tests with a local mock server, API responses return almost instantly, making loading states appear for only milliseconds.

**Solution**: Don't test loading states in E2E tests. Instead, wait for the final content to appear.

**Lessons**:
1. **Don't check loading states in E2E** - They're too fast/flaky to reliably test
2. **Use specific route patterns** - When mocking API calls with `page.route()`, use specific URL patterns (e.g., `**/localhost:3333/plans`) to avoid intercepting page navigation
3. **Test final outcomes, not intermediate states** - Wait for content/errors to appear, not loading spinners

**Example**:
```typescript
// BAD - flaky
await expect(page.getByText('Loading...')).toBeVisible();
await expect(page.getByText('Loading...')).not.toBeVisible();

// GOOD - stable
await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
```
