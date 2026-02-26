import { useQuery } from '@tanstack/react-query';
import { fetchPlans } from '../core/api';

export function usePlans(enabled = true) {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => fetchPlans(),
    enabled,
  });
}
