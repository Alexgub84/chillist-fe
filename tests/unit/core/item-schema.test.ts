import { describe, it, expect } from 'vitest';
import {
  itemSchema,
  itemCreateSchema,
  itemPatchSchema,
} from '../../../src/core/schemas/item';

describe('itemSchema date-time and format validation', () => {
  const validItem = {
    itemId: 'item-1',
    planId: 'plan-1',
    name: 'Tent',
    category: 'equipment' as const,
    quantity: 2,
    unit: 'pcs' as const,
    status: 'pending' as const,
    isAllParticipants: false,
    assignmentStatusList: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('accepts a valid item with RFC 3339 timestamps', () => {
    const result = itemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('accepts createdAt without timezone designator', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      createdAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts updatedAt without timezone designator', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      updatedAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-integer quantity', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts integer quantity', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      quantity: 3,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null for notes', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts string for notes', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      notes: 'Bring extra stakes',
    });
    expect(result.success).toBe(true);
  });

  it('accepts item without isAllParticipants and defaults to false', () => {
    const itemWithoutField = {
      itemId: validItem.itemId,
      planId: validItem.planId,
      name: validItem.name,
      quantity: validItem.quantity,
      unit: validItem.unit,
      status: validItem.status,
      category: validItem.category,
      createdAt: validItem.createdAt,
      updatedAt: validItem.updatedAt,
    };
    const result = itemSchema.safeParse(itemWithoutField);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAllParticipants).toBe(false);
    }
  });
});

describe('itemCreateSchema', () => {
  it('accepts minimal valid item create payload', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = itemCreateSchema.safeParse({
      name: '',
      category: 'equipment',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing category', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity of 0', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 0,
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: -1,
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer quantity', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1.5,
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('accepts unit as optional (omitted)', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBeUndefined();
    }
  });

  it('rejects invalid category value', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'clothing',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status value', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'archived',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 255 characters', () => {
    const result = itemCreateSchema.safeParse({
      name: 'A'.repeat(256),
      category: 'equipment',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('accepts notes as null', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts notes as undefined (omitted)', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it('accepts isAllParticipants boolean', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
      isAllParticipants: true,
      assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAllParticipants).toBe(true);
    }
  });

  it('accepts assignmentStatusList array', () => {
    const result = itemCreateSchema.safeParse({
      name: 'Tent',
      category: 'equipment',
      quantity: 1,
      status: 'pending',
      assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignmentStatusList).toEqual([
        { participantId: 'p-1', status: 'pending' },
      ]);
    }
  });
});

describe('itemPatchSchema', () => {
  it('accepts assignmentStatusList array', () => {
    const result = itemPatchSchema.safeParse({
      assignmentStatusList: [{ participantId: 'p-1', status: 'pending' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignmentStatusList).toEqual([
        { participantId: 'p-1', status: 'pending' },
      ]);
    }
  });

  it('accepts empty assignmentStatusList (unassign)', () => {
    const result = itemPatchSchema.safeParse({
      assignmentStatusList: [],
      isAllParticipants: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignmentStatusList).toEqual([]);
    }
  });

  it('accepts isAllParticipants boolean', () => {
    const result = itemPatchSchema.safeParse({ isAllParticipants: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAllParticipants).toBe(true);
    }
  });

  it('accepts empty object (no-op update)', () => {
    const result = itemPatchSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
