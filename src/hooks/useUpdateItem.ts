import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateItem } from '../core/api';
import type { Item, ItemPatch } from '../core/schemas/item';
import type { PlanWithDetails } from '../core/schemas/plan';

interface UpdateItemVariables {
  itemId: string;
  updates: ItemPatch;
}

export function enrichUpdates(item: Item, updates: ItemPatch): ItemPatch {
  const enriched = { ...updates };

  if (enriched.assignmentStatusList === undefined) {
    enriched.assignmentStatusList = [...item.assignmentStatusList];
  }

  if (enriched.isAllParticipants === undefined) {
    enriched.isAllParticipants = item.isAllParticipants;
  }

  return enriched;
}

export function useUpdateItem(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: UpdateItemVariables) => {
      const plan = queryClient.getQueryData<PlanWithDetails>(['plan', planId]);
      const item = plan?.items.find((i) => i.itemId === itemId);
      const finalUpdates = item ? enrichUpdates(item, updates) : updates;
      return updateItem(itemId, finalUpdates);
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['plan', planId] });

      const previousPlan = queryClient.getQueryData<PlanWithDetails>([
        'plan',
        planId,
      ]);

      queryClient.setQueryData<PlanWithDetails>(['plan', planId], (old) => {
        if (!old) return old;
        const item = old.items.find((i) => i.itemId === itemId);
        const enriched = item ? enrichUpdates(item, updates) : updates;
        return {
          ...old,
          items: old.items.map((i) =>
            i.itemId === itemId ? { ...i, ...enriched } : i
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
