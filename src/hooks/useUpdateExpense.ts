import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExpense } from '../core/api';
import type { ExpensePatch } from '../core/schemas/expense';

interface UpdateExpenseVariables {
  expenseId: string;
  updates: ExpensePatch;
}

export function useUpdateExpense(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, updates }: UpdateExpenseVariables) =>
      updateExpense(expenseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', planId] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
