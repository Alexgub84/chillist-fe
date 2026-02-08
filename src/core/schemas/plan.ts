import { z } from 'zod';
import { locationSchema } from './location';
import { itemSchema } from './item';

export const planStatusSchema = z.enum(['draft', 'active', 'archived']);
export const planVisibilitySchema = z.enum(['public', 'unlisted', 'private']);

export const planSchema = z.object({
  planId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  status: planStatusSchema,
  visibility: planVisibilitySchema,
  ownerParticipantId: z.string().nullish(),
  location: locationSchema.nullish(),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  tags: z.array(z.string()).nullish(),
  participantIds: z.array(z.string()).nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const planWithItemsSchema = planSchema.extend({
  items: z.array(itemSchema),
});

export const planCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().nullish(),
  status: planStatusSchema.default('draft'),
  visibility: planVisibilitySchema.default('private'),
  ownerParticipantId: z.string().min(1),
  location: locationSchema.nullish(),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  tags: z.array(z.string()).nullish(),
  participantIds: z.array(z.string()).nullish(),
});

export const planPatchSchema = planCreateSchema.partial();

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type PlanVisibility = z.infer<typeof planVisibilitySchema>;
export type Plan = z.infer<typeof planSchema>;
export type PlanWithItems = z.infer<typeof planWithItemsSchema>;
export type PlanCreate = z.infer<typeof planCreateSchema>;
export type PlanPatch = z.infer<typeof planPatchSchema>;
