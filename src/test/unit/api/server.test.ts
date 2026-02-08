import { describe, expect, it } from 'vitest';

import { buildServer } from '../../../../api/server';
import type { MockData } from '../../../../api/mock';

function createTestData(): MockData {
  const now = new Date().toISOString();
  return {
    plans: [
      {
        planId: 'plan-1',
        title: 'Test Plan',
        status: 'draft',
        ownerParticipantId: 'participant-1',
        participantIds: ['participant-1'],
        createdAt: now,
        updatedAt: now,
      },
    ],
    participants: [
      {
        participantId: 'participant-1',
        displayName: 'Alex',
        name: 'Alex',
        lastName: 'Guberman',
        role: 'owner',
        isOwner: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    items: [
      {
        itemId: 'item-1',
        planId: 'plan-1',
        name: 'Tent',
        quantity: 1,
        unit: 'pcs',
        status: 'pending',
        category: 'equipment',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

describe('mock server', () => {
  it('lists existing plans', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({ method: 'GET', url: '/plans' });
      expect(response.statusCode).toBe(200);

      const payload = response.json() as unknown;
      expect(Array.isArray(payload)).toBe(true);
      expect((payload as Array<Record<string, unknown>>).length).toBe(1);
    } finally {
      await server.close();
    }
  });

  it('creates a new plan with defaults', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans',
        payload: {
          title: 'Summer Trip',
          ownerParticipantId: 'participant-1',
          status: 'active',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.planId).toEqual(expect.any(String));
      expect(payload.status).toBe('active');
      expect(payload.participantIds).toEqual(
        expect.arrayContaining(['participant-1'])
      );
    } finally {
      await server.close();
    }
  });

  it('fetches a single plan with items', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/plans/plan-1',
      });
      expect(response.statusCode).toBe(200);

      const payload = response.json() as Record<string, unknown>;
      expect(payload.planId).toBe('plan-1');
      expect(payload.title).toBe('Test Plan');
      expect(Array.isArray(payload.items)).toBe(true);
      expect((payload.items as Array<Record<string, unknown>>).length).toBe(1);
      expect((payload.items as Array<Record<string, unknown>>)[0].itemId).toBe(
        'item-1'
      );
    } finally {
      await server.close();
    }
  });

  it('adds a participant to a plan', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/participants',
        payload: {
          displayName: 'Jamie',
          role: 'participant',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.participantId).toEqual(expect.any(String));
      expect(payload.role).toBe('participant');

      const planResponse = await server.inject({
        method: 'GET',
        url: '/plans/plan-1',
      });
      const plan = planResponse.json() as { participantIds?: string[] };
      expect(plan.participantIds).toEqual(
        expect.arrayContaining([payload.participantId as string])
      );
    } finally {
      await server.close();
    }
  });

  it('creates a new item for a plan', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/items',
        payload: {
          name: 'Lantern',
          category: 'equipment',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.itemId).toEqual(expect.any(String));
      expect(payload.planId).toBe('plan-1');
      expect(payload.status).toBe('pending');
    } finally {
      await server.close();
    }
  });

  it('returns 404 when a plan is missing', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/plans/unknown',
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await server.close();
    }
  });
});
