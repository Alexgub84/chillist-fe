import { z } from 'zod';

export const itemCategorySchema = z.enum(['equipment', 'food']);
export const itemStatusSchema = z.enum([
  'pending',
  'purchased',
  'packed',
  'canceled',
]);
export const unitSchema = z.enum([
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'l',
  'ml',
  'pack',
  'set',
]);

const baseItemSchema = z.object({
  itemId: z.string(),
  planId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unit: unitSchema,
  notes: z.string().nullish(),
  status: itemStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().positive().optional(),
  unit: unitSchema.optional(),
  status: itemStatusSchema.optional(),
  notes: z.string().optional(),
  category: itemCategorySchema,
});

export const itemPatchSchema = itemCreateSchema.partial();

export type ItemCategory = z.infer<typeof itemCategorySchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;
export type FoodItem = z.infer<typeof foodItemSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ItemCreate = z.infer<typeof itemCreateSchema>;
export type ItemPatch = z.infer<typeof itemPatchSchema>;
