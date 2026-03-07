import { useQuery } from '@tanstack/react-query';
import { fetchExpenses } from '../core/api';

export function useExpenses(planId: string) {
  return useQuery({
    queryKey: ['expenses', planId],
    queryFn: () => fetchExpenses(planId),
  });
}
