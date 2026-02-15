import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlanWithOwner } from '../core/api';
import type { PlanCreateWithOwner } from '../core/schemas/plan';

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: PlanCreateWithOwner) => createPlanWithOwner(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
