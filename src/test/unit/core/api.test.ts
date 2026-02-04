import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createItem,
  createParticipant,
  createPlan,
  deleteItem,
  deleteParticipant,
  deletePlan,
  fetchItem,
  fetchItems,
  fetchParticipant,
  fetchParticipants,
  fetchPlan,
  fetchPlans,
  updateItem,
  updateParticipant,
  updatePlan,
} from '../../../core/api';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Client', () => {
  beforeEach(() => {
    fetchMock.mockClear();
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

  const mockParticipant = {
    participantId: 'p-1',
    displayName: 'Test User',
    name: 'Test',
    lastName: 'User',
    role: 'owner',
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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPlan],
      });

      const plans = await fetchPlans();
      expect(plans).toEqual([mockPlan]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plans',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('fetches a single plan', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      const plan = await fetchPlan('plan-1');
      expect(plan).toEqual(mockPlan);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates a plan', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockPlan, title: 'Updated' }),
      });

      const updates = { title: 'Updated' };
      const plan = await updatePlan('plan-1', updates);
      expect(plan.title).toBe('Updated');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('deletes a plan', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deletePlan('plan-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Participants', () => {
    it('fetches participants for a plan', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockParticipant],
      });

      const participants = await fetchParticipants('plan-1');
      expect(participants).toEqual([mockParticipant]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1/participants',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates a participant', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipant,
      });

      const newParticipant = {
        displayName: 'Test User',
        role: 'owner' as const,
      };

      const participant = await createParticipant('plan-1', newParticipant);
      expect(participant).toEqual(mockParticipant);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1/participants',
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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipant,
      });

      const participant = await fetchParticipant('p-1');
      expect(participant).toEqual(mockParticipant);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/participants/p-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('updates a participant', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockParticipant, displayName: 'Updated' }),
      });

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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteParticipant('p-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/participants/p-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Items', () => {
    it('fetches items for a plan', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockItem],
      });

      const items = await fetchItems('plan-1');
      expect(items).toEqual([mockItem]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1/items',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('creates an item', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      });

      const newItem = {
        name: 'Tent',
        category: 'equipment' as const,
      };

      const item = await createItem('plan-1', newItem);
      expect(item).toEqual(mockItem);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/plan/plan-1/items',
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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      });

      const item = await fetchItem('item-1');
      expect(item).toEqual(mockItem);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/items/item-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('updates an item', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockItem, quantity: 2 }),
      });

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
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteItem('item-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/items/item-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('throws error when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
      });

      await expect(fetchPlan('unknown')).rejects.toThrow('Not Found');
    });

    it('handles non-JSON error response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Parse error');
        },
      });

      await expect(fetchPlan('plan-1')).rejects.toThrow('API request failed');
    });
  });
});
