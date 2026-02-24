import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const emitAuthErrorMock = vi.hoisted(() => vi.fn());

vi.mock('../../../src/core/auth-error', () => ({
  emitAuthError: emitAuthErrorMock,
}));

const supabaseMock = vi.hoisted(() => {
  const fn = vi.fn;
  return {
    auth: {
      getSession: fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      refreshSession: fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      }),
      onAuthStateChange: fn().mockReturnValue({
        data: { subscription: { unsubscribe: fn() } },
      }),
    },
  };
});

vi.mock('../../../src/lib/supabase', () => ({
  supabase: supabaseMock,
}));

const DEFAULT_SESSION = {
  access_token: 'mock-access-token-xyz',
  refresh_token: 'mock-refresh-token-xyz',
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@chillist.dev',
    user_metadata: {},
  },
};

import {
  createItem,
  createParticipant,
  createPlan,
  createPlanWithOwner,
  deleteItem,
  deleteParticipant,
  deletePlan,
  fetchAuthMe,
  fetchItem,
  fetchItems,
  fetchParticipant,
  fetchParticipants,
  fetchPlan,
  fetchPlans,
  updateItem,
  updateParticipant,
  updatePlan,
} from '../../../src/core/api';

const fetchMock = vi.fn();
global.fetch = fetchMock;

function mockResponse(
  body: unknown,
  options: { ok?: boolean; status?: number; contentType?: string } = {}
) {
  const { ok = true, status = 200, contentType = 'application/json' } = options;
  return {
    ok,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? contentType : null,
    },
    json: async () => body,
  };
}

describe('API Client', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    emitAuthErrorMock.mockClear();
    supabaseMock.auth.refreshSession.mockClear();
    vi.stubEnv('VITE_API_URL', 'http://api.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const mockPlan = {
    planId: 'plan-1',
    title: 'Test Plan',
    status: 'draft',
    visibility: 'private',
    ownerParticipantId: 'p-1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockPlanWithDetails = {
    ...mockPlan,
    items: [
      {
        itemId: 'item-1',
        planId: 'plan-1',
        name: 'Tent',
        quantity: 1,
        unit: 'pcs',
        status: 'pending',
        category: 'equipment',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ],
    participants: [
      {
        participantId: 'p-1',
        planId: 'plan-1',
        name: 'Test',
        lastName: 'User',
        contactPhone: '+1234567890',
        role: 'owner',
        rsvpStatus: 'confirmed',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ],
  };

  const mockParticipant = {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Test',
    lastName: 'User',
    contactPhone: '+1234567890',
    displayName: 'Test User',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockItem = {
    itemId: 'item-1',
    planId: 'plan-1',
    name: 'Tent',
    quantity: 1,
    unit: 'pcs',
    status: 'pending',
    category: 'equipment',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  describe('Plans', () => {
    it('fetches all plans', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([mockPlan]));

      const plans = await fetchPlans();
      expect(plans).toEqual([mockPlan]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('fetches a single plan with items and participants', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockPlanWithDetails));

      const plan = await fetchPlan('plan-1');
      expect(plan).toEqual(mockPlanWithDetails);
      expect(plan.items).toHaveLength(1);
      expect(plan.participants).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates a plan', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockPlan));

      const newPlan = {
        title: 'Test Plan',
        status: 'draft' as const,
        visibility: 'private' as const,
        ownerParticipantId: 'p-1',
      };

      const plan = await createPlan(newPlan);
      expect(plan).toEqual(mockPlan);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPlan),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('updates a plan', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ ...mockPlan, title: 'Updated' })
      );

      const updates = { title: 'Updated' };
      const plan = await updatePlan('plan-1', updates);
      expect(plan.title).toBe('Updated');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('rejects plan creation with invalid startDate format', async () => {
      const invalidPlan = {
        title: 'Bad Dates Plan',
        status: 'draft' as const,
        visibility: 'private' as const,
        ownerParticipantId: 'p-1',
        startDate: '2025-12-20T10:00:00',
      };

      await expect(createPlan(invalidPlan)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects plan update with invalid startDate format', async () => {
      const invalidUpdates = {
        startDate: '2025-12-20T10:00:00',
      };

      await expect(updatePlan('plan-1', invalidUpdates)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('deletes a plan', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, { status: 204 }));

      await deletePlan('plan-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('creates a plan with owner', async () => {
      const mockResponse201 = {
        ...mockPlan,
        items: [],
        participants: [
          {
            participantId: 'owner-1',
            planId: 'plan-1',
            name: 'Alice',
            lastName: 'Smith',
            contactPhone: '+1234567890',
            role: 'owner',
            rsvpStatus: 'confirmed',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };
      fetchMock.mockResolvedValueOnce(
        mockResponse(mockResponse201, { status: 201 })
      );

      const payload = {
        title: 'Test Plan',
        owner: {
          name: 'Alice',
          lastName: 'Smith',
          contactPhone: '+1234567890',
        },
      };

      const plan = await createPlanWithOwner(payload);
      expect(plan.planId).toBe('plan-1');
      expect(plan.participants).toHaveLength(1);
      expect(plan.participants[0].name).toBe('Alice');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/with-owner',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Participants', () => {
    it('fetches participants for a plan', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([mockParticipant]));

      const participants = await fetchParticipants('plan-1');
      expect(participants).toEqual([mockParticipant]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1/participants',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates a participant', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockParticipant));

      const newParticipant = {
        name: 'Test',
        lastName: 'User',
        contactPhone: '+1234567890',
      };

      const participant = await createParticipant('plan-1', newParticipant);
      expect(participant).toEqual(mockParticipant);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1/participants',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newParticipant),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('fetches a single participant', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockParticipant));

      const participant = await fetchParticipant('p-1');
      expect(participant).toEqual(mockParticipant);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/participants/p-1',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('updates a participant', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ ...mockParticipant, displayName: 'Updated' })
      );

      const updates = { displayName: 'Updated' };
      const participant = await updateParticipant('p-1', updates);
      expect(participant.displayName).toBe('Updated');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/participants/p-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deletes a participant', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, { status: 204 }));

      await deleteParticipant('p-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/participants/p-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Items', () => {
    it('fetches items for a plan', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([mockItem]));

      const items = await fetchItems('plan-1');
      expect(items).toEqual([mockItem]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1/items',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates an item', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockItem));

      const newItem = {
        name: 'Tent',
        category: 'equipment' as const,
        quantity: 1,
        status: 'pending' as const,
      };

      const item = await createItem('plan-1', newItem);
      expect(item).toEqual(mockItem);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans/plan-1/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newItem),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('fetches a single item', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(mockItem));

      const item = await fetchItem('item-1');
      expect(item).toEqual(mockItem);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/items/item-1',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('updates an item', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ ...mockItem, quantity: 2 })
      );

      const updates = { quantity: 2 };
      const item = await updateItem('item-1', updates);
      expect(item.quantity).toBe(2);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/items/item-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deletes an item', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

      await deleteItem('item-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/items/item-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('throws error when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ message: 'Not Found' }, { ok: false, status: 404 })
      );

      await expect(fetchPlan('unknown')).rejects.toThrow('Not Found');
    });

    it('handles non-JSON error response', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(null, {
          ok: false,
          status: 500,
          contentType: 'text/html',
        })
      );

      await expect(fetchPlans()).rejects.toThrow('API returned 500');
    });

    it('throws clear error when API returns HTML instead of JSON', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(null, { ok: true, status: 200, contentType: 'text/html' })
      );

      await expect(fetchPlans()).rejects.toThrow(
        'Invalid API response: Expected JSON'
      );
    });
  });

  describe('JWT Injection', () => {
    it('includes Authorization header when session exists', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });
      fetchMock.mockResolvedValueOnce(mockResponse([mockPlan]));

      await fetchPlans();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${DEFAULT_SESSION.access_token}`,
          }),
        })
      );
    });

    it('omits Authorization header when no session', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });
      fetchMock.mockResolvedValueOnce(mockResponse([mockPlan]));

      await fetchPlans();

      const callHeaders = fetchMock.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
    });
  });

  describe('401 Retry with Token Refresh', () => {
    it('retries with refreshed token on 401 when session exists', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });

      const refreshedSession = {
        ...DEFAULT_SESSION,
        access_token: 'refreshed-token-abc',
      };
      supabaseMock.auth.refreshSession.mockResolvedValueOnce({
        data: { session: refreshedSession },
        error: null,
      });

      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ message: 'Unauthorized' }, { ok: false, status: 401 })
        )
        .mockResolvedValueOnce(mockResponse([mockPlan]));

      const plans = await fetchPlans();
      expect(plans).toEqual([mockPlan]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(supabaseMock.auth.refreshSession).toHaveBeenCalledOnce();

      const retryHeaders = fetchMock.mock.calls[1][1].headers;
      expect(retryHeaders['Authorization']).toBe('Bearer refreshed-token-abc');
    });

    it('emits auth error when retry also returns 401', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });

      const refreshedSession = {
        ...DEFAULT_SESSION,
        access_token: 'refreshed-token-abc',
      };
      supabaseMock.auth.refreshSession.mockResolvedValueOnce({
        data: { session: refreshedSession },
        error: null,
      });

      fetchMock
        .mockResolvedValueOnce(
          mockResponse({ message: 'Unauthorized' }, { ok: false, status: 401 })
        )
        .mockResolvedValueOnce(
          mockResponse(
            { message: 'Still unauthorized' },
            { ok: false, status: 401 }
          )
        );

      await expect(fetchPlans()).rejects.toThrow('Still unauthorized');
      expect(emitAuthErrorMock).toHaveBeenCalledOnce();
    });

    it('emits auth error when refresh fails', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });
      supabaseMock.auth.refreshSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Refresh failed' },
      });

      fetchMock.mockResolvedValueOnce(
        mockResponse({ message: 'Unauthorized' }, { ok: false, status: 401 })
      );

      await expect(fetchPlans()).rejects.toThrow('Unauthorized');
      expect(emitAuthErrorMock).toHaveBeenCalledOnce();
    });

    it('does not retry on 401 when no token was sent', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      fetchMock.mockResolvedValueOnce(
        mockResponse({ message: 'Unauthorized' }, { ok: false, status: 401 })
      );

      await expect(fetchPlans()).rejects.toThrow('Unauthorized');
      expect(supabaseMock.auth.refreshSession).not.toHaveBeenCalled();
      expect(emitAuthErrorMock).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auth - fetchAuthMe', () => {
    it('returns parsed user from /auth/me', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });
      fetchMock.mockResolvedValueOnce(
        mockResponse({
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test@chillist.dev',
            role: 'authenticated',
          },
        })
      );

      const result = await fetchAuthMe();
      expect(result.user.email).toBe('test@chillist.dev');
      expect(result.user.role).toBe('authenticated');
    });

    it('rejects when response shape is invalid', async () => {
      supabaseMock.auth.getSession.mockResolvedValueOnce({
        data: { session: DEFAULT_SESSION },
        error: null,
      });
      fetchMock.mockResolvedValueOnce(mockResponse({ invalid: true }));

      await expect(fetchAuthMe()).rejects.toThrow();
    });
  });
});
