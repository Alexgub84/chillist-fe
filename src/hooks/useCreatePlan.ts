import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlan } from '../core/api';
import type { PlanCreate } from '../core/schemas/plan';

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: PlanCreate) => createPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
