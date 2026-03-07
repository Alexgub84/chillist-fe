import { describe, expect, it } from 'vitest';

import { buildServer } from '../../../api/server';
import type { MockData } from '../../../api/mock';

function createTestData(): MockData {
  const now = new Date().toISOString();
  return {
    plans: [
      {
        planId: 'plan-1',
        title: 'Test Plan',
        status: 'active',
        visibility: 'private',
        ownerParticipantId: 'participant-owner',
        participantIds: ['participant-owner', 'participant-2'],
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
      },
    ],
    participants: [
      {
        participantId: 'participant-owner',
        planId: 'plan-1',
        displayName: 'Alice',
        name: 'Alice',
        lastName: 'Owner',
        role: 'owner',
        rsvpStatus: 'confirmed',
        inviteStatus: 'accepted',
        inviteToken: 'owner-token',
        userId: 'owner-user-id',
        createdAt: now,
        updatedAt: now,
      },
      {
        participantId: 'participant-2',
        planId: 'plan-1',
        displayName: 'Bob',
        name: 'Bob',
        lastName: 'Helper',
        role: 'participant',
        rsvpStatus: 'pending',
        inviteStatus: 'invited',
        inviteToken: 'bob-token',
        userId: 'bob-user-id',
        createdAt: now,
        updatedAt: now,
      },
    ],
    items: [],
  };
}

function mockJwt(sub = 'owner-user-id', email = 'test@chillist.dev') {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, email, role: 'authenticated' }));
  return `Bearer ${header}.${payload}.mock-signature`;
}

async function createServer() {
  return buildServer({
    initialData: createTestData(),
    persist: false,
    logger: false,
  });
}

describe('expense endpoints', () => {
  describe('GET /plans/:planId/expenses', () => {
    it('returns empty expenses and summary for a plan with no expenses', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'GET',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
        });
        expect(res.statusCode).toBe(200);
        const body = res.json() as { expenses: unknown[]; summary: unknown[] };
        expect(body.expenses).toEqual([]);
        expect(body.summary).toEqual([]);
      } finally {
        await server.close();
      }
    });

    it('returns 401 without auth', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'GET',
          url: '/plans/plan-1/expenses',
        });
        expect(res.statusCode).toBe(401);
      } finally {
        await server.close();
      }
    });

    it('returns 404 for non-existent plan', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'GET',
          url: '/plans/non-existent/expenses',
          headers: { authorization: mockJwt() },
        });
        expect(res.statusCode).toBe(404);
      } finally {
        await server.close();
      }
    });

    it('returns expenses and computed summary after creating expenses', async () => {
      const server = await createServer();
      try {
        await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-owner',
            amount: 25.5,
            description: 'Groceries',
          },
        });
        await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-owner',
            amount: 14.5,
            description: 'Gas',
          },
        });
        await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-2',
            amount: 10,
            description: 'Snacks',
          },
        });

        const res = await server.inject({
          method: 'GET',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
        });
        expect(res.statusCode).toBe(200);

        const body = res.json() as {
          expenses: Record<string, unknown>[];
          summary: { participantId: string; totalAmount: number }[];
        };
        expect(body.expenses).toHaveLength(3);

        const ownerSummary = body.summary.find(
          (s) => s.participantId === 'participant-owner'
        );
        expect(ownerSummary?.totalAmount).toBe(40);

        const bobSummary = body.summary.find(
          (s) => s.participantId === 'participant-2'
        );
        expect(bobSummary?.totalAmount).toBe(10);
      } finally {
        await server.close();
      }
    });
  });

  describe('POST /plans/:planId/expenses', () => {
    it('creates an expense and returns it', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-owner',
            amount: 29.99,
            description: 'Camping fuel',
          },
        });
        expect(res.statusCode).toBe(201);

        const expense = res.json() as Record<string, unknown>;
        expect(expense.expenseId).toBeDefined();
        expect(expense.participantId).toBe('participant-owner');
        expect(expense.planId).toBe('plan-1');
        expect(expense.amount).toBe('29.99');
        expect(expense.description).toBe('Camping fuel');
        expect(expense.createdByUserId).toBe('owner-user-id');
        expect(expense.createdAt).toBeDefined();
        expect(expense.updatedAt).toBeDefined();
      } finally {
        await server.close();
      }
    });

    it('creates expense without description', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-2',
            amount: 15,
          },
        });
        expect(res.statusCode).toBe(201);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.description).toBeNull();
      } finally {
        await server.close();
      }
    });

    it('returns 400 when amount is missing', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: { participantId: 'participant-owner' },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 400 when amount is zero', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: { participantId: 'participant-owner', amount: 0 },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 400 when amount is negative', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: { participantId: 'participant-owner', amount: -5 },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 400 when participantId is missing', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: { amount: 10 },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 404 for non-existent participant', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: { participantId: 'ghost', amount: 10 },
        });
        expect(res.statusCode).toBe(404);
      } finally {
        await server.close();
      }
    });

    it('returns 404 for non-existent plan', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/no-plan/expenses',
          headers: { authorization: mockJwt() },
          payload: { participantId: 'participant-owner', amount: 10 },
        });
        expect(res.statusCode).toBe(404);
      } finally {
        await server.close();
      }
    });

    it('returns 401 without auth', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          payload: { participantId: 'participant-owner', amount: 10 },
        });
        expect(res.statusCode).toBe(401);
      } finally {
        await server.close();
      }
    });

    it('formats amount to 2 decimal places', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-owner',
            amount: 9.9,
          },
        });
        expect(res.statusCode).toBe(201);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.amount).toBe('9.90');
      } finally {
        await server.close();
      }
    });
  });

  describe('PATCH /expenses/:expenseId', () => {
    async function createExpenseAndGetId(
      server: Awaited<ReturnType<typeof createServer>>
    ): Promise<string> {
      const res = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/expenses',
        headers: { authorization: mockJwt() },
        payload: {
          participantId: 'participant-owner',
          amount: 20,
          description: 'Original',
        },
      });
      return (res.json() as Record<string, unknown>).expenseId as string;
    }

    it('updates expense amount', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);

        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { amount: 35 },
        });
        expect(res.statusCode).toBe(200);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.amount).toBe('35.00');
        expect(expense.description).toBe('Original');
      } finally {
        await server.close();
      }
    });

    it('updates expense description', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);

        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { description: 'Updated description' },
        });
        expect(res.statusCode).toBe(200);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.description).toBe('Updated description');
        expect(expense.amount).toBe('20.00');
      } finally {
        await server.close();
      }
    });

    it('clears description with null', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);

        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { description: null },
        });
        expect(res.statusCode).toBe(200);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.description).toBeNull();
      } finally {
        await server.close();
      }
    });

    it('updates both amount and description', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);

        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { amount: 99.99, description: 'New' },
        });
        expect(res.statusCode).toBe(200);
        const expense = res.json() as Record<string, unknown>;
        expect(expense.amount).toBe('99.99');
        expect(expense.description).toBe('New');
      } finally {
        await server.close();
      }
    });

    it('returns 400 for zero amount', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);
        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { amount: 0 },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 400 for negative amount', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);
        const res = await server.inject({
          method: 'PATCH',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
          payload: { amount: -10 },
        });
        expect(res.statusCode).toBe(400);
      } finally {
        await server.close();
      }
    });

    it('returns 404 for non-existent expense', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'PATCH',
          url: '/expenses/non-existent',
          headers: { authorization: mockJwt() },
          payload: { amount: 10 },
        });
        expect(res.statusCode).toBe(404);
      } finally {
        await server.close();
      }
    });

    it('returns 401 without auth', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'PATCH',
          url: '/expenses/any-id',
          payload: { amount: 10 },
        });
        expect(res.statusCode).toBe(401);
      } finally {
        await server.close();
      }
    });
  });

  describe('DELETE /expenses/:expenseId', () => {
    async function createExpenseAndGetId(
      server: Awaited<ReturnType<typeof createServer>>
    ): Promise<string> {
      const res = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/expenses',
        headers: { authorization: mockJwt() },
        payload: {
          participantId: 'participant-owner',
          amount: 10,
        },
      });
      return (res.json() as Record<string, unknown>).expenseId as string;
    }

    it('deletes an existing expense', async () => {
      const server = await createServer();
      try {
        const expenseId = await createExpenseAndGetId(server);

        const res = await server.inject({
          method: 'DELETE',
          url: `/expenses/${expenseId}`,
          headers: { authorization: mockJwt() },
        });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ ok: true });

        const listRes = await server.inject({
          method: 'GET',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
        });
        const body = listRes.json() as { expenses: unknown[] };
        expect(body.expenses).toHaveLength(0);
      } finally {
        await server.close();
      }
    });

    it('returns 404 for non-existent expense', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'DELETE',
          url: '/expenses/non-existent',
          headers: { authorization: mockJwt() },
        });
        expect(res.statusCode).toBe(404);
      } finally {
        await server.close();
      }
    });

    it('returns 401 without auth', async () => {
      const server = await createServer();
      try {
        const res = await server.inject({
          method: 'DELETE',
          url: '/expenses/any-id',
        });
        expect(res.statusCode).toBe(401);
      } finally {
        await server.close();
      }
    });
  });

  describe('expense reset', () => {
    it('clears expenses on /_reset', async () => {
      const server = await createServer();
      try {
        await server.inject({
          method: 'POST',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
          payload: {
            participantId: 'participant-owner',
            amount: 50,
          },
        });

        await server.inject({ method: 'POST', url: '/_reset' });

        const res = await server.inject({
          method: 'GET',
          url: '/plans/plan-1/expenses',
          headers: { authorization: mockJwt() },
        });
        const body = res.json() as { expenses: unknown[] };
        expect(body.expenses).toHaveLength(0);
      } finally {
        await server.close();
      }
    });
  });
});
