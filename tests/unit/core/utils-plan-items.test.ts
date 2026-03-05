import { describe, it, expect } from 'vitest';
import {
  countItemsPerParticipant,
  filterItemsByAssignedParticipant,
  countItemsByListTab,
  filterItemsByStatusTab,
} from '../../../src/core/utils-plan-items';
import type { Item } from '../../../src/core/schemas/item';
import type { Participant } from '../../../src/core/schemas/participant';

const ts = '2025-01-01T00:00:00Z';

function makeItem(
  overrides: Partial<Item> & { name: string; category: Item['category'] }
): Item {
  return {
    itemId: overrides.itemId ?? overrides.name,
    planId: 'plan-1',
    quantity: 1,
    unit: 'pcs',
    status: 'pending',
    isAllParticipants: false,
    assignmentStatusList: [],
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  } as Item;
}

function makeParticipant(id: string): Participant {
  return {
    participantId: id,
    planId: 'plan-1',
    name: 'Test',
    lastName: 'User',
    contactPhone: '',
    role: 'participant',
    rsvpStatus: 'confirmed',
    createdAt: ts,
    updatedAt: ts,
  };
}

describe('countItemsPerParticipant', () => {
  it('counts items assigned to each participant', () => {
    const participants = [makeParticipant('p-1'), makeParticipant('p-2')];
    const items = [
      makeItem({
        name: 'a',
        category: 'food',
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
      }),
      makeItem({
        name: 'b',
        category: 'food',
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
      }),
      makeItem({
        name: 'c',
        category: 'food',
        assignmentStatusList: [{ participantId: 'p-2', status: 'pending' }],
      }),
    ];

    const result = countItemsPerParticipant(participants, items);
    expect(result['p-1']).toBe(2);
    expect(result['p-2']).toBe(1);
    expect(result['unassigned']).toBe(0);
  });

  it('counts unassigned items', () => {
    const participants = [makeParticipant('p-1')];
    const items = [
      makeItem({ name: 'a', category: 'food', assignmentStatusList: [] }),
      makeItem({ name: 'b', category: 'food' }),
    ];

    const result = countItemsPerParticipant(participants, items);
    expect(result['unassigned']).toBe(2);
    expect(result['p-1']).toBe(0);
  });

  it('returns only unassigned key when no participants', () => {
    const result = countItemsPerParticipant([], []);
    expect(result).toEqual({ unassigned: 0 });
  });

  it('counts items assigned to an unknown participant under their ID', () => {
    const participants = [makeParticipant('p-1')];
    const items = [
      makeItem({
        name: 'a',
        category: 'food',
        assignmentStatusList: [
          { participantId: 'p-unknown', status: 'pending' },
        ],
      }),
    ];

    const result = countItemsPerParticipant(participants, items);
    expect(result['p-unknown']).toBe(1);
    expect(result['p-1']).toBe(0);
  });

  it('excludes canceled items from participant counts', () => {
    const participants = [makeParticipant('p-1'), makeParticipant('p-2')];
    const items = [
      makeItem({
        name: 'a',
        category: 'food',
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
        status: 'pending',
      }),
      makeItem({
        name: 'b',
        category: 'food',
        assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
        status: 'canceled',
      }),
      makeItem({
        name: 'c',
        category: 'food',
        assignmentStatusList: [],
        status: 'canceled',
      }),
    ];

    const result = countItemsPerParticipant(participants, items);
    expect(result['p-1']).toBe(1);
    expect(result['p-2']).toBe(0);
    expect(result['unassigned']).toBe(0);
  });
});

describe('filterItemsByAssignedParticipant', () => {
  const items = [
    makeItem({
      name: 'a',
      category: 'food',
      assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
    }),
    makeItem({
      name: 'b',
      category: 'food',
      assignmentStatusList: [{ participantId: 'p-2', status: 'pending' }],
    }),
    makeItem({ name: 'c', category: 'food', assignmentStatusList: [] }),
  ];

  it('returns all items when filter is undefined', () => {
    expect(filterItemsByAssignedParticipant(items, undefined)).toHaveLength(3);
  });

  it('filters by specific participant', () => {
    const result = filterItemsByAssignedParticipant(items, 'p-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('a');
  });

  it('filters unassigned items', () => {
    const result = filterItemsByAssignedParticipant(items, 'unassigned');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('c');
  });

  it('returns empty array when no match', () => {
    expect(
      filterItemsByAssignedParticipant(items, 'p-nonexistent')
    ).toHaveLength(0);
  });
});

describe('countItemsByListTab', () => {
  it('counts pending as buying and purchased+pending as packing', () => {
    const items = [
      makeItem({ name: 'a', category: 'food', status: 'pending' }),
      makeItem({ name: 'b', category: 'food', status: 'pending' }),
      makeItem({ name: 'c', category: 'food', status: 'purchased' }),
      makeItem({ name: 'd', category: 'food', status: 'packed' }),
    ];

    const result = countItemsByListTab(items);
    expect(result.buying).toBe(2);
    expect(result.packing).toBe(3);
  });

  it('returns zeros for empty list', () => {
    expect(countItemsByListTab([])).toEqual({ buying: 0, packing: 0 });
  });
});

describe('filterItemsByStatusTab', () => {
  const items = [
    makeItem({ name: 'a', category: 'food', status: 'pending' }),
    makeItem({ name: 'b', category: 'food', status: 'purchased' }),
    makeItem({ name: 'c', category: 'food', status: 'packed' }),
  ];

  it('returns all items when filter is undefined', () => {
    expect(filterItemsByStatusTab(items, undefined)).toHaveLength(3);
  });

  it('filters buying tab to pending items', () => {
    const result = filterItemsByStatusTab(items, 'buying');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
  });

  it('filters packing tab to purchased and pending items', () => {
    const result = filterItemsByStatusTab(items, 'packing');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.status).sort()).toEqual([
      'pending',
      'purchased',
    ]);
  });
});
