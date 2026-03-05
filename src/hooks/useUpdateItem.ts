import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateItem } from '../core/api';
import type { Item, ItemPatch } from '../core/schemas/item';
import type { PlanWithDetails } from '../core/schemas/plan';

interface UpdateItemVariables {
  itemId: string;
  updates: ItemPatch;
}

function applyOptimisticUpdate(item: Item, updates: ItemPatch): Item {
  const { assignmentStatusList, isAllParticipants, ...rest } = updates;

  const merged: Item = { ...item, ...rest };

  if (assignmentStatusList !== undefined) {
    merged.assignmentStatusList = assignmentStatusList;
  }
  if (isAllParticipants !== undefined) {
    merged.isAllParticipants = isAllParticipants;
  }

  return merged;
}

export function useUpdateItem(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: UpdateItemVariables) =>
      updateItem(itemId, updates),
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['plan', planId] });

      const previousPlan = queryClient.getQueryData<PlanWithDetails>([
        'plan',
        planId,
      ]);

      queryClient.setQueryData<PlanWithDetails>(['plan', planId], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.itemId === itemId ? applyOptimisticUpdate(item, updates) : item
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
