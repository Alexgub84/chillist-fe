# Dev Lessons

A log of bugs fixed and problems solved in this project.

---

<!-- Add new entries at the top -->

## 2026-02-08: Zod Schemas Must Mirror OpenAPI Format Constraints

**Problem**: Creating a new plan failed with `body/startDate must match format "date-time"`. The `makeDateTime` helper produced `2025-12-20T10:00:00` (no timezone designator), which is not valid RFC 3339.

**Root Cause**: Three layers of defense all had gaps:
1. Zod schemas used `z.string().optional()` instead of `z.string().datetime().optional()`, silently dropping the `format: "date-time"` constraint from the OpenAPI spec.
2. `createPlan()` and `updatePlan()` did not validate input before sending (unlike `createParticipant()` / `createItem()` which already called `.parse()`).
3. Tests asserted the wrong date format (`'2025-12-20T10:00:00'` instead of `'2025-12-20T10:00:00Z'`), encoding the bug as expected behavior.

**Solution**:
- Appended `Z` to `makeDateTime` output in `PlanForm.tsx`.
- Added `.datetime()` to all date fields in Zod schemas (`planSchema`, `planCreateSchema`).
- Added input validation (`.parse()`) to `createPlan()` and `updatePlan()` for parity.
- Fixed all test assertions and added schema-level + API-level tests for date format.

**Lessons**:
1. When hand-writing Zod schemas from an OpenAPI spec, always translate `format` constraints (e.g. `date-time` -> `z.string().datetime()`), not just the `type`.
2. Every API mutation function should validate input with `.parse()` before sending — catch bad data client-side.
3. Tests that assert payload shape should verify format correctness, not just structural presence.
4. If multiple API functions follow the same pattern, audit them all for consistency (the bug existed only in `createPlan`/`updatePlan`, not in `createParticipant`/`createItem`).

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
