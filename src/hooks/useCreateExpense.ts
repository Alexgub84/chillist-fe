import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExpense } from '../core/api';
import type { ExpenseCreate } from '../core/schemas/expense';

export function useCreateExpense(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ExpenseCreate) => createExpense(planId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
