import { useQuery } from '@tanstack/react-query';
import type { Plan } from '../core/types/plan';

export function usePlan(planId: string) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: async (): Promise<Plan> => {
      const response = await fetch(`http://localhost:3333/plan/${planId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }
      return response.json();
    },
  });
}
