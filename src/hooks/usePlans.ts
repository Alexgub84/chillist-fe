import { useQuery } from '@tanstack/react-query';

export interface Plan {
  planId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  visibility?: 'public' | 'unlisted' | 'private';
  ownerParticipantId: string;
  location?: {
    locationId: string;
    name?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
    city?: string;
  };
  startDate?: string;
  endDate?: string;
  tags?: string[];
  participantIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3333/plans', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      return response.json();
    },
  });
}
