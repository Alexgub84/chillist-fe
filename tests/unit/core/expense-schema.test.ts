import { describe, it, expect } from 'vitest';
import {
  expenseSchema,
  expenseSummarySchema,
  expensesResponseSchema,
  expenseCreateSchema,
  expensePatchSchema,
} from '../../../src/core/schemas/expense';

const validExpense = {
  expenseId: 'exp-1',
  participantId: 'p-1',
  planId: 'plan-1',
  amount: '29.99',
  description: 'Groceries',
  createdByUserId: 'user-1',
  createdAt: '2026-03-07T10:00:00Z',
  updatedAt: '2026-03-07T10:00:00Z',
};

describe('expenseSchema', () => {
  it('accepts a valid expense', () => {
    const result = expenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('accepts null for optional fields', () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      description: null,
      createdByUserId: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts undefined for optional fields', () => {
    const { description, createdByUserId, ...rest } = validExpense;
    void description;
    void createdByUserId;
    const result = expenseSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { expenseId, ...rest } = validExpense;
    void expenseId;
    const result = expenseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts timestamps without timezone designator', () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      createdAt: '2026-03-07T10:00:00',
      updatedAt: '2026-03-07T10:00:00',
    });
    expect(result.success).toBe(true);
  });

  it('stores amount as string (matches BE numeric type)', () => {
    const result = expenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.amount).toBe('string');
    }
  });

  it('accepts expense with itemIds', () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      itemIds: ['item-1', 'item-2'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts expense without itemIds', () => {
    const result = expenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('accepts expense with empty itemIds', () => {
    const result = expenseSchema.safeParse({
      ...validExpense,
      itemIds: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('expenseSummarySchema', () => {
  it('accepts a valid summary entry', () => {
    const result = expenseSummarySchema.safeParse({
      participantId: 'p-1',
      totalAmount: 59.98,
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero totalAmount', () => {
    const result = expenseSummarySchema.safeParse({
      participantId: 'p-1',
      totalAmount: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing participantId', () => {
    const result = expenseSummarySchema.safeParse({ totalAmount: 10 });
    expect(result.success).toBe(false);
  });
});

describe('expensesResponseSchema', () => {
  it('accepts a valid response with expenses and summary', () => {
    const result = expensesResponseSchema.safeParse({
      expenses: [validExpense],
      summary: [{ participantId: 'p-1', totalAmount: 29.99 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty arrays', () => {
    const result = expensesResponseSchema.safeParse({
      expenses: [],
      summary: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing expenses field', () => {
    const result = expensesResponseSchema.safeParse({
      summary: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing summary field', () => {
    const result = expensesResponseSchema.safeParse({
      expenses: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('expenseCreateSchema', () => {
  it('accepts valid create body', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: 29.99,
      description: 'Groceries',
    });
    expect(result.success).toBe(true);
  });

  it('accepts create body without optional description', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty participantId', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: '',
      amount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing participantId', () => {
    const result = expenseCreateSchema.safeParse({ amount: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects missing amount', () => {
    const result = expenseCreateSchema.safeParse({ participantId: 'p-1' });
    expect(result.success).toBe(false);
  });

  it('accepts create body with itemIds', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: 29.99,
      itemIds: ['item-1', 'item-2'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts create body without itemIds', () => {
    const result = expenseCreateSchema.safeParse({
      participantId: 'p-1',
      amount: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe('expensePatchSchema', () => {
  it('accepts amount-only update', () => {
    const result = expensePatchSchema.safeParse({ amount: 50 });
    expect(result.success).toBe(true);
  });

  it('accepts description-only update', () => {
    const result = expensePatchSchema.safeParse({
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('accepts both fields', () => {
    const result = expensePatchSchema.safeParse({
      amount: 42,
      description: 'Updated',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null description (to clear it)', () => {
    const result = expensePatchSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = expensePatchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = expensePatchSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = expensePatchSchema.safeParse({ amount: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts patch with itemIds', () => {
    const result = expensePatchSchema.safeParse({
      itemIds: ['item-1'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts patch with empty itemIds', () => {
    const result = expensePatchSchema.safeParse({
      itemIds: [],
    });
    expect(result.success).toBe(true);
  });
});
