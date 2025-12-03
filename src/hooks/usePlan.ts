import { useQuery } from '@tanstack/react-query';
import { fetchPlan } from '../core/api';

export function usePlan(planId: string) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => fetchPlan(planId),
    retry: false,
  });
}
