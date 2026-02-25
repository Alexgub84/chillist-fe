import { z } from 'zod';
import type { components } from '../api.generated';
import { locationSchema } from './location';
import { itemSchema } from './item';

type BEInviteParticipant = components['schemas']['def-26'];
type BEInvitePlanResponse = components['schemas']['def-28'];

const INVITE_ROLE_VALUES = [
  'owner',
  'participant',
  'viewer',
] as const satisfies readonly BEInviteParticipant['role'][];

export const inviteParticipantSchema = z.object({
  participantId: z.string(),
  displayName: z.string().nullish(),
  role: z.enum(INVITE_ROLE_VALUES),
});

const INVITE_PLAN_STATUS_VALUES = [
  'draft',
  'active',
  'archived',
] as const satisfies readonly BEInvitePlanResponse['status'][];

const RSVP_STATUS_VALUES = ['pending', 'confirmed', 'not_sure'] as const;

const guestPreferencesSchema = z.object({
  adultsCount: z.number().nullish(),
  kidsCount: z.number().nullish(),
  foodPreferences: z.string().nullish(),
  allergies: z.string().nullish(),
  notes: z.string().nullish(),
});

export const invitePlanResponseSchema = z.object({
  planId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  status: z.enum(INVITE_PLAN_STATUS_VALUES),
  location: locationSchema.nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(itemSchema),
  participants: z.array(inviteParticipantSchema),
  myParticipantId: z.string(),
  myRsvpStatus: z.enum(RSVP_STATUS_VALUES),
  myPreferences: guestPreferencesSchema.nullish(),
});

export type InviteParticipant = z.infer<typeof inviteParticipantSchema>;
export type InvitePlanResponse = z.infer<typeof invitePlanResponseSchema>;
export type GuestPreferences = z.infer<typeof guestPreferencesSchema>;
export type RsvpStatus = (typeof RSVP_STATUS_VALUES)[number];
