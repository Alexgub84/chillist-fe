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
        status: 'draft',
        visibility: 'private',
        ownerParticipantId: 'participant-1',
        participantIds: ['participant-1', 'participant-2'],
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
        rsvpStatus: 'confirmed',
        inviteStatus: 'accepted',
        inviteToken: 'valid-invite-token-abc123',
        isOwner: true,
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
        inviteToken: 'claimable-invite-token-xyz789',
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
      logger: false,
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
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans',
        payload: {
          title: 'Summer Trip',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.planId).toEqual(expect.any(String));
      expect(payload.status).toBe('draft');
      expect(payload.visibility).toBe('private');
    } finally {
      await server.close();
    }
  });

  it('fetches a single plan with items', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
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
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/participants',
        payload: {
          name: 'Jamie',
          lastName: 'Rivera',
          contactPhone: '+1234567890',
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

  it('creates a plan with owner via /plans/with-owner', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/with-owner',
        payload: {
          title: 'Beach Trip',
          owner: {
            name: 'Alex',
            lastName: 'G',
            contactPhone: '+9876543210',
          },
          participants: [
            {
              name: 'Jamie',
              lastName: 'Rivera',
              contactPhone: '+1111111111',
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.planId).toEqual(expect.any(String));
      expect(payload.title).toBe('Beach Trip');
      expect(payload.status).toBe('draft');
      expect(Array.isArray(payload.items)).toBe(true);
      expect((payload.items as unknown[]).length).toBe(0);
      expect(Array.isArray(payload.participants)).toBe(true);
      const participants = payload.participants as Array<
        Record<string, unknown>
      >;
      expect(participants.length).toBe(2);
      expect(participants[0].role).toBe('owner');
      expect(participants[0].name).toBe('Alex');
      expect(participants[1].role).toBe('participant');
      expect(participants[1].name).toBe('Jamie');
    } finally {
      await server.close();
    }
  });

  it('creates a new item for a plan', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/items',
        payload: {
          name: 'Lantern',
          category: 'equipment',
          quantity: 2,
          status: 'pending',
        },
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json() as Record<string, unknown>;
      expect(payload.itemId).toEqual(expect.any(String));
      expect(payload.planId).toBe('plan-1');
      expect(payload.quantity).toBe(2);
      expect(payload.status).toBe('pending');
    } finally {
      await server.close();
    }
  });

  it('returns 404 when a plan is missing', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
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

  it('GET /auth/me returns user from JWT payload', async () => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'alex@chillist.dev',
        role: 'authenticated',
      })
    );
    const token = `${header}.${payload}.mock-signature`;

    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { user: Record<string, unknown> };
      expect(body.user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(body.user.email).toBe('alex@chillist.dev');
      expect(body.user.role).toBe('authenticated');
    } finally {
      await server.close();
    }
  });

  it('GET /auth/me falls back to defaults for malformed JWT', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer not-a-real-jwt',
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { user: Record<string, unknown> };
      expect(body.user.email).toBe('test@chillist.dev');
      expect(body.user.role).toBe('authenticated');
    } finally {
      await server.close();
    }
  });

  it('GET /auth/me returns 401 when Authorization header is missing', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/me',
      });
      expect(response.statusCode).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('GET /plans/:planId/invite/:inviteToken returns stripped plan for valid token', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/plans/plan-1/invite/valid-invite-token-abc123',
      });
      expect(response.statusCode).toBe(200);

      const payload = response.json() as Record<string, unknown>;
      expect(payload.planId).toBe('plan-1');
      expect(payload.title).toBe('Test Plan');
      expect(Array.isArray(payload.items)).toBe(true);
      expect(Array.isArray(payload.participants)).toBe(true);

      const participants = payload.participants as Array<
        Record<string, unknown>
      >;
      expect(participants[0]).toHaveProperty('participantId');
      expect(participants[0]).toHaveProperty('displayName');
      expect(participants[0]).toHaveProperty('role');
      expect(participants[0]).not.toHaveProperty('contactPhone');
      expect(participants[0]).not.toHaveProperty('contactEmail');
    } finally {
      await server.close();
    }
  });

  it('GET /plans/:planId/invite/:inviteToken returns 404 for invalid token', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/plans/plan-1/invite/wrong-token',
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('POST /plans/:planId/claim/:inviteToken claims a participant spot', async () => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({ sub: 'claiming-user-id', email: 'bob@chillist.dev' })
    );
    const token = `${header}.${payload}.mock-signature`;

    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/claim/claimable-invite-token-xyz789',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Record<string, unknown>;
      expect(body.participantId).toBe('participant-2');
      expect(body.userId).toBe('claiming-user-id');
      expect(body.inviteStatus).toBe('accepted');
    } finally {
      await server.close();
    }
  });

  it('POST /plans/:planId/claim/:inviteToken returns 401 without auth', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/claim/claimable-invite-token-xyz789',
      });
      expect(response.statusCode).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('POST /plans/:planId/claim/:inviteToken returns 404 for invalid token', async () => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'some-user' }));
    const token = `${header}.${payload}.mock-signature`;

    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/claim/nonexistent-token',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('PATCH /plans/:planId/invite/:inviteToken/preferences saves guest preferences', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'PATCH',
        url: '/plans/plan-1/invite/claimable-invite-token-xyz789/preferences',
        payload: { adultsCount: 2, kidsCount: 1, foodPreferences: 'Vegan' },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Record<string, unknown>;
      expect(body.participantId).toBe('participant-2');
      expect(body.displayName).toBeTruthy();
    } finally {
      await server.close();
    }
  });

  it('PATCH /plans/:planId/invite/:inviteToken/preferences returns 404 for invalid token', async () => {
    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'PATCH',
        url: '/plans/plan-1/invite/nonexistent-token/preferences',
        payload: { adultsCount: 1 },
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('POST /plans/:planId/claim/:inviteToken returns 400 when already claimed', async () => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'some-user' }));
    const token = `${header}.${payload}.mock-signature`;

    const server = await buildServer({
      initialData: createTestData(),
      persist: false,
      logger: false,
    });
    try {
      const response = await server.inject({
        method: 'POST',
        url: '/plans/plan-1/claim/valid-invite-token-abc123',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(400);
    } finally {
      await server.close();
    }
  });
});
