import { z } from 'zod';
import type { components } from '../api.generated';

type BEItem = components['schemas']['def-12'];

const CATEGORY_VALUES = [
  'equipment',
  'food',
] as const satisfies readonly BEItem['category'][];
const STATUS_VALUES = [
  'pending',
  'purchased',
  'packed',
  'canceled',
] as const satisfies readonly BEItem['status'][];
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

const baseItemSchema = z.object({
  itemId: z.string(),
  planId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unit: unitSchema,
  notes: z.string().nullish(),
  status: itemStatusSchema,
  subcategory: z.string().nullish(),
  assignedParticipantId: z.string().nullish(),
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
  status: itemStatusSchema,
  subcategory: z.string().nullish(),
  notes: z.string().nullish(),
  assignedParticipantId: z.string().nullish(),
});

export const itemPatchSchema = itemCreateSchema.partial();

export const bulkUpdateItemEntrySchema = z
  .object({ itemId: z.string() })
  .merge(itemPatchSchema);

export const bulkItemErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
});

export const bulkItemResponseSchema = z.object({
  items: z.array(itemSchema),
  errors: z.array(bulkItemErrorSchema),
});

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
