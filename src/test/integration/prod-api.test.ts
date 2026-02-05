import { describe, it, expect } from 'vitest';

const PROD_API_URL = 'https://chillist-be-prod-production.up.railway.app';

describe.skip('Production API - Smoke Tests', () => {
  it('should fetch plans from production API', async () => {
    const response = await fetch(`${PROD_API_URL}/plans`);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return 404 for non-existent plan', async () => {
    const response = await fetch(`${PROD_API_URL}/plan/non-existent-plan-id`);

    expect(response.status).toBe(404);
  });
});
