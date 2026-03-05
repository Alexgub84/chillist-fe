import { z } from 'zod';
import type { components } from '../api.generated';

type BEItem = components['schemas']['def-14'];
type BECreateItemBody = components['schemas']['def-16'];
type BEUpdateItemBody = components['schemas']['def-17'];
type BEBulkUpdateItemEntry = components['schemas']['def-47'];

const CATEGORY_VALUES = [
  'equipment',
  'food',
] as const satisfies readonly BEItem['category'][];
const STATUS_VALUES = [
  'pending',
  'purchased',
  'packed',
  'canceled',
] as const satisfies readonly BEItem['assignmentStatusList'][number]['status'][];
const UNIT_VALUES = [
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'l',
  'ml',
  'm',
  'cm',
  'pack',
  'set',
] as const satisfies readonly BEItem['unit'][];

export const itemCategorySchema = z.enum(CATEGORY_VALUES);
export const itemStatusSchema = z.enum(STATUS_VALUES);
export const unitSchema = z.enum(UNIT_VALUES);

export const assignmentStatusEntrySchema = z.object({
  participantId: z.string(),
  status: itemStatusSchema,
});

const baseItemSchema = z.object({
  itemId: z.string(),
  planId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unit: unitSchema,
  notes: z.string().nullish(),
  subcategory: z.string().nullish(),
  isAllParticipants: z.boolean().default(false),
  assignmentStatusList: z.array(assignmentStatusEntrySchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const equipmentItemSchema = baseItemSchema.extend({
  category: z.literal('equipment'),
});

export const foodItemSchema = baseItemSchema.extend({
  category: z.literal('food'),
});

export const itemSchema = z.discriminatedUnion('category', [
  equipmentItemSchema,
  foodItemSchema,
]);

export const itemCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: itemCategorySchema,
  quantity: z.number().int().min(1),
  unit: unitSchema.optional(),
  subcategory: z.string().nullish(),
  notes: z.string().nullish(),
  assignmentStatusList: z.array(assignmentStatusEntrySchema).optional(),
  isAllParticipants: z.boolean().optional(),
});

type _AssertCreateKeys = keyof z.infer<typeof itemCreateSchema> extends
  | keyof BECreateItemBody
  | 'quantity'
  ? true
  : never;
const _assertCreate: _AssertCreateKeys = true;
void _assertCreate;

export const itemPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: itemCategorySchema.optional(),
  quantity: z.number().int().min(1).optional(),
  unit: unitSchema.optional(),
  subcategory: z.string().nullish(),
  notes: z.string().nullish(),
  assignmentStatusList: z.array(assignmentStatusEntrySchema).optional(),
  isAllParticipants: z.boolean().optional(),
});

type _AssertPatchKeys = keyof z.infer<
  typeof itemPatchSchema
> extends keyof BEUpdateItemBody
  ? true
  : never;
const _assertPatch: _AssertPatchKeys = true;
void _assertPatch;

export const bulkUpdateItemEntrySchema = z
  .object({ itemId: z.string() })
  .merge(itemPatchSchema);

type _AssertBulkKeys = keyof z.infer<
  typeof bulkUpdateItemEntrySchema
> extends keyof BEBulkUpdateItemEntry
  ? true
  : never;
const _assertBulk: _AssertBulkKeys = true;
void _assertBulk;

export const bulkItemErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
});

export const bulkItemResponseSchema = z.object({
  items: z.array(itemSchema),
  errors: z.array(bulkItemErrorSchema),
});

export type AssignmentStatusEntry = z.infer<typeof assignmentStatusEntrySchema>;
export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;
export type FoodItem = z.infer<typeof foodItemSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ItemCreate = z.infer<typeof itemCreateSchema>;
export type ItemPatch = z.infer<typeof itemPatchSchema>;
export type BulkUpdateItemEntry = z.infer<typeof bulkUpdateItemEntrySchema>;
export type BulkItemResponse = z.infer<typeof bulkItemResponseSchema>;
