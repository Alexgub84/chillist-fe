import { describe, it, expect } from 'vitest';
import { itemSchema, itemCreateSchema } from '../../../core/schemas/item';

describe('itemSchema date-time and format validation', () => {
  const validItem = {
    itemId: 'item-1',
    planId: 'plan-1',
    name: 'Tent',
    category: 'equipment' as const,
    quantity: 2,
    unit: 'pcs' as const,
    status: 'pending' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('accepts a valid item with RFC 3339 timestamps', () => {
    const result = itemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('rejects createdAt without timezone designator', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      createdAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects updatedAt without timezone designator', () => {
    const result = itemSchema.safeParse({
      ...validItem,
      updatedAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(false);
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
});
