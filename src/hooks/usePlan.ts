import { useQuery } from '@tanstack/react-query';
import { fetchPlan } from '../core/api';
import type { PlanWithItems } from '../core/schemas/plan';

export function usePlan(planId: string) {
  return useQuery<PlanWithItems>({
    queryKey: ['plan', planId],
    queryFn: () => fetchPlan(planId),
    retry: false,
  });
}
