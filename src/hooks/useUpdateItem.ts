import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateItem } from '../core/api';
import type { ItemPatch } from '../core/schemas/item';
import type { PlanWithItems } from '../core/schemas/plan';

interface UpdateItemVariables {
  itemId: string;
  updates: ItemPatch;
}

export function useUpdateItem(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: UpdateItemVariables) =>
      updateItem(itemId, updates),
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['plan', planId] });

      const previousPlan = queryClient.getQueryData<PlanWithItems>([
        'plan',
        planId,
      ]);

      queryClient.setQueryData<PlanWithItems>(['plan', planId], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.itemId === itemId ? { ...item, ...updates } : item
          ),
        };
      });

      return { previousPlan };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(['plan', planId], context.previousPlan);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
