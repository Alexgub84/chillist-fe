import { useQuery } from '@tanstack/react-query';
import { fetchAdminPlans } from '../core/api';

export function useAdminPlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: fetchAdminPlans,
  });
}
