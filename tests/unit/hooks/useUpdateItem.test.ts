import { describe, it, expect } from 'vitest';
import { enrichUpdates } from '../../../src/hooks/useUpdateItem';
import type { Item } from '../../../src/core/schemas/item';

const baseItem: Item = {
  itemId: 'item-1',
  planId: 'plan-1',
  name: 'Tent',
  category: 'equipment',
  quantity: 2,
  unit: 'pcs',
  subcategory: null,
  notes: null,
  isAllParticipants: false,
  assignmentStatusList: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('enrichUpdates', () => {
  describe('assignmentStatusList always included', () => {
    it('includes current assignmentStatusList when updating non-status field', () => {
      const item: Item = {
        ...baseItem,
        assignmentStatusList: [
          { participantId: 'p-1', status: 'pending' },
          { participantId: 'p-2', status: 'pending' },
        ],
        isAllParticipants: true,
      };

      const result = enrichUpdates(item, { quantity: 5 });

      expect(result.assignmentStatusList).toEqual([
        { participantId: 'p-1', status: 'pending' },
        { participantId: 'p-2', status: 'pending' },
      ]);
      expect(result.isAllParticipants).toBe(true);
      expect(result.quantity).toBe(5);
    });

    it('includes empty assignmentStatusList for unassigned items', () => {
      const result = enrichUpdates(baseItem, { name: 'Sleeping Bag' });

      expect(result.assignmentStatusList).toEqual([]);
      expect(result.isAllParticipants).toBe(false);
    });
  });

  describe('explicit assignmentStatusList is not overwritten', () => {
    const allAssignedItem: Item = {
      ...baseItem,
      isAllParticipants: true,
      assignmentStatusList: [
        { participantId: 'p-1', status: 'pending' },
        { participantId: 'p-2', status: 'pending' },
      ],
    };

    it('uses provided assignmentStatusList when explicitly set', () => {
      const result = enrichUpdates(allAssignedItem, {
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
        isAllParticipants: false,
      });

      expect(result.assignmentStatusList).toEqual([
        { participantId: 'p-1', status: 'pending' },
      ]);
      expect(result.isAllParticipants).toBe(false);
    });

    it('does not override explicit empty assignmentStatusList', () => {
      const result = enrichUpdates(allAssignedItem, {
        assignmentStatusList: [],
        isAllParticipants: false,
      });

      expect(result.assignmentStatusList).toEqual([]);
      expect(result.isAllParticipants).toBe(false);
    });
  });

  describe('mixed status assignmentStatusList preserved on non-status edit', () => {
    it('preserves different per-participant statuses when editing quantity', () => {
      const mixedItem: Item = {
        ...baseItem,
        isAllParticipants: true,
        assignmentStatusList: [
          { participantId: 'p-1', status: 'purchased' },
          { participantId: 'p-2', status: 'pending' },
          { participantId: 'p-3', status: 'packed' },
        ],
      };

      const result = enrichUpdates(mixedItem, { quantity: 10 });

      expect(result.assignmentStatusList).toEqual([
        { participantId: 'p-1', status: 'purchased' },
        { participantId: 'p-2', status: 'pending' },
        { participantId: 'p-3', status: 'packed' },
      ]);
    });
  });
});
