import { z } from 'zod';

export const participantRoleSchema = z.enum(['owner', 'participant', 'viewer']);

export const participantCreateRoleSchema = z.enum(['participant', 'viewer']);

export const participantSchema = z.object({
  participantId: z.string(),
  planId: z.string(),
  name: z.string(),
  lastName: z.string(),
  contactPhone: z.string(),
  displayName: z.string().nullish(),
  role: participantRoleSchema,
  avatarUrl: z.string().nullish(),
  contactEmail: z.string().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const participantCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  contactPhone: z.string().min(1, 'Phone is required').max(50),
  displayName: z.string().min(1).max(255).optional(),
  role: participantCreateRoleSchema.optional(),
  avatarUrl: z.string().optional(),
  contactEmail: z.string().max(255).optional(),
});

export const participantPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  contactPhone: z.string().min(1).max(50).optional(),
  displayName: z.string().max(255).nullish(),
  role: participantCreateRoleSchema.optional(),
  avatarUrl: z.string().nullish(),
  contactEmail: z.string().max(255).nullish(),
});

export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type ParticipantCreate = z.infer<typeof participantCreateSchema>;
export type ParticipantPatch = z.infer<typeof participantPatchSchema>;
