import { z } from 'zod';
import { locationSchema } from './location';

export const planStatusSchema = z.enum(['draft', 'active', 'archived']);
export const planVisibilitySchema = z.enum(['public', 'unlisted', 'private']);

export const planSchema = z.object({
  planId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: planStatusSchema,
  visibility: planVisibilitySchema.optional(),
  ownerParticipantId: z.string(),
  location: locationSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  participantIds: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type PlanVisibility = z.infer<typeof planVisibilitySchema>;
export type Plan = z.infer<typeof planSchema>;
