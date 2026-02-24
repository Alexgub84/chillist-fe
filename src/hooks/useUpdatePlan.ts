import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePlan } from '../core/api';
import type { PlanPatch } from '../core/schemas/plan';

export function useUpdatePlan(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: PlanPatch) => updatePlan(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
