import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '../core/api';
import type { ItemCreate } from '../core/schemas/item';

export function useCreateItem(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: ItemCreate) => createItem(planId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
