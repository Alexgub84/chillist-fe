import { z } from 'zod';
import type { components } from '../api.generated';

type BEExpense = components['schemas']['def-58'];
type BECreateExpenseBody = components['schemas']['def-63'];
type BEUpdateExpenseBody = components['schemas']['def-64'];

export const expenseSchema = z.object({
  expenseId: z.string(),
  participantId: z.string(),
  planId: z.string(),
  amount: z.string(),
  description: z.string().nullish(),
  createdByUserId: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type _AssertExpenseKeys = keyof z.infer<
  typeof expenseSchema
> extends keyof BEExpense
  ? keyof BEExpense extends keyof z.infer<typeof expenseSchema>
    ? true
    : never
  : never;
const _assertExpense: _AssertExpenseKeys = true;
void _assertExpense;

export const expenseSummarySchema = z.object({
  participantId: z.string(),
  totalAmount: z.number(),
});

export const expensesResponseSchema = z.object({
  expenses: z.array(expenseSchema),
  summary: z.array(expenseSummarySchema),
});

export const expenseCreateSchema = z.object({
  participantId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
});

type _AssertCreateKeys = keyof z.infer<
  typeof expenseCreateSchema
> extends keyof BECreateExpenseBody
  ? true
  : never;
const _assertCreate: _AssertCreateKeys = true;
void _assertCreate;

export const expensePatchSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().nullish(),
});

type _AssertPatchKeys = keyof z.infer<
  typeof expensePatchSchema
> extends keyof BEUpdateExpenseBody
  ? true
  : never;
const _assertPatch: _AssertPatchKeys = true;
void _assertPatch;

export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseSummary = z.infer<typeof expenseSummarySchema>;
export type ExpensesResponse = z.infer<typeof expensesResponseSchema>;
export type ExpenseCreate = z.infer<typeof expenseCreateSchema>;
export type ExpensePatch = z.infer<typeof expensePatchSchema>;
