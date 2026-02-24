import { z } from 'zod';
import type { components } from '../api.generated';

type BEParticipant = components['schemas']['def-18'];
type BECreateParticipant = components['schemas']['def-20'];
type BEUpdateParticipant = components['schemas']['def-21'];

const ROLE_VALUES = [
  'owner',
  'participant',
  'viewer',
] as const satisfies readonly BEParticipant['role'][];
const CREATE_ROLE_VALUES = [
  'participant',
  'viewer',
] as const satisfies readonly NonNullable<BECreateParticipant['role']>[];
const RSVP_STATUS_VALUES = [
  'pending',
  'confirmed',
  'not_sure',
] as const satisfies readonly BEParticipant['rsvpStatus'][];

export const participantRoleSchema = z.enum(ROLE_VALUES);
export const participantCreateRoleSchema = z.enum(CREATE_ROLE_VALUES);
export const rsvpStatusSchema = z.enum(RSVP_STATUS_VALUES);

export const participantSchema = z.object({
  participantId: z.string(),
  planId: z.string(),
  userId: z.string().nullish(),
  name: z.string(),
  lastName: z.string(),
  contactPhone: z.string(),
  displayName: z.string().nullish(),
  role: participantRoleSchema,
  avatarUrl: z.string().nullish(),
  contactEmail: z.string().nullish(),
  inviteToken: z.string().nullish(),
  rsvpStatus: rsvpStatusSchema,
  lastActivityAt: z.string().datetime().nullish(),
  adultsCount: z.number().nullish(),
  kidsCount: z.number().nullish(),
  foodPreferences: z.string().nullish(),
  allergies: z.string().nullish(),
  notes: z.string().nullish(),
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
  adultsCount: z.number().int().min(0).optional(),
  kidsCount: z.number().int().min(0).optional(),
  foodPreferences: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

export const participantPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  contactPhone: z.string().min(1).max(50).optional(),
  displayName: z.string().max(255).nullish(),
  role: participantCreateRoleSchema.optional(),
  avatarUrl: z.string().nullish(),
  contactEmail: z.string().max(255).nullish(),
  adultsCount: z.number().int().min(0).nullish(),
  kidsCount: z.number().int().min(0).nullish(),
  foodPreferences: z.string().nullish(),
  allergies: z.string().nullish(),
  notes: z.string().nullish(),
});

export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type ParticipantCreate = z.infer<typeof participantCreateSchema>;
export type ParticipantPatch = z.infer<typeof participantPatchSchema>;

export type ParticipantPreferences = Pick<
  BEUpdateParticipant,
  'adultsCount' | 'kidsCount' | 'foodPreferences' | 'allergies' | 'notes'
>;
