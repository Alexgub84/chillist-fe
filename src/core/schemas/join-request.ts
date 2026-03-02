import { z } from 'zod';

const joinRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
] as const);

export const joinRequestSchema = z.object({
  requestId: z.string(),
  planId: z.string(),
  supabaseUserId: z.string(),
  name: z.string(),
  lastName: z.string(),
  contactPhone: z.string(),
  contactEmail: z.string().nullish(),
  displayName: z.string().nullish(),
  adultsCount: z.number().nullish(),
  kidsCount: z.number().nullish(),
  foodPreferences: z.string().nullish(),
  allergies: z.string().nullish(),
  notes: z.string().nullish(),
  status: joinRequestStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type JoinRequest = z.infer<typeof joinRequestSchema>;
export type JoinRequestStatus = z.infer<typeof joinRequestStatusSchema>;
