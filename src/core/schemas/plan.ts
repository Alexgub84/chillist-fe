import { z } from 'zod';
import { locationSchema } from './location';
import { itemSchema } from './item';
import { participantSchema, participantCreateSchema } from './participant';

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

export const planWithDetailsSchema = planSchema.extend({
  items: z.array(itemSchema),
  participants: z.array(participantSchema),
});

export const ownerBodySchema = z.object({
  name: z.string().min(1, 'Owner name is required').max(255),
  lastName: z.string().min(1, 'Owner last name is required').max(255),
  contactPhone: z.string().min(1, 'Owner phone is required').max(50),
  displayName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().optional(),
  contactEmail: z.string().max(255).optional(),
});

export const planCreateWithOwnerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().nullish(),
  visibility: planVisibilitySchema.optional(),
  location: locationSchema.nullish(),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  tags: z.array(z.string()).nullish(),
  owner: ownerBodySchema,
  participants: z.array(participantCreateSchema).optional(),
});

// Legacy schemas (used by deprecated POST /plans and PATCH /plans/:planId)
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

export const planPatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  status: planStatusSchema.optional(),
  visibility: planVisibilitySchema.optional(),
  location: locationSchema.nullish(),
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
  tags: z.array(z.string()).nullish(),
});

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type PlanVisibility = z.infer<typeof planVisibilitySchema>;
export type Plan = z.infer<typeof planSchema>;
export type PlanWithItems = z.infer<typeof planWithItemsSchema>;
export type PlanWithDetails = z.infer<typeof planWithDetailsSchema>;
export type PlanCreate = z.infer<typeof planCreateSchema>;
export type PlanCreateWithOwner = z.infer<typeof planCreateWithOwnerSchema>;
export type PlanPatch = z.infer<typeof planPatchSchema>;
