import { useQuery } from '@tanstack/react-query';
import { fetchPendingRequests } from '../core/api';

export function usePendingRequests(enabled = true) {
  return useQuery({
    queryKey: ['plans', 'pending-requests'],
    queryFn: () => fetchPendingRequests(),
    enabled,
  });
}
