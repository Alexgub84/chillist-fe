export type ParticipantRole = 'owner' | 'participant' | 'viewer';

export interface Participant {
  participantId: string;
  name: string;
  lastName: string;
  displayName: string;
  role: ParticipantRole;
  isOwner?: boolean;
  avatarUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}
