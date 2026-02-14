import { useQuery } from '@tanstack/react-query';
import { fetchPlan } from '../core/api';
import type { PlanWithDetails } from '../core/schemas/plan';

export function usePlan(planId: string) {
  return useQuery<PlanWithDetails>({
    queryKey: ['plan', planId],
    queryFn: () => fetchPlan(planId),
    retry: false,
  });
}
