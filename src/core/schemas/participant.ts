import { z } from 'zod';

export const participantRoleSchema = z.enum(['owner', 'participant', 'viewer']);

export const participantSchema = z.object({
  participantId: z.string(),
  name: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  role: participantRoleSchema,
  isOwner: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const participantCreateSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  role: participantRoleSchema,
  name: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export const participantPatchSchema = participantCreateSchema.partial();

export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type ParticipantCreate = z.infer<typeof participantCreateSchema>;
export type ParticipantPatch = z.infer<typeof participantPatchSchema>;
