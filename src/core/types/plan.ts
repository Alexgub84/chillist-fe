import type { Location } from './location';

export type PlanStatus = 'draft' | 'active' | 'archived';

export type PlanVisibility = 'public' | 'unlisted' | 'private';

export interface Plan {
  planId: string;
  title: string;
  description?: string;
  status: PlanStatus;
  visibility?: PlanVisibility;
  ownerParticipantId: string;
  location?: Location;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
