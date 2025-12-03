import { useQuery } from '@tanstack/react-query';
import { fetchPlans } from '../core/api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => fetchPlans(),
  });
}
