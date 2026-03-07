import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteExpense } from '../core/api';

export function useDeleteExpense(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', planId] });
    },
  });
}
