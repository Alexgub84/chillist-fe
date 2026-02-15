import { test as base, expect, type Page } from '@playwright/test';

const MOCK_API = 'http://localhost:3333';

const test = base.extend<{ resetMockData: void }>({
  resetMockData: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await fetch(`${MOCK_API}/_reset`, { method: 'POST' });
      await use();
    },
    { auto: true },
  ],
});

export { test, expect, type Page };
