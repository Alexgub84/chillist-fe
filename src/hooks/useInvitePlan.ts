import { useQuery } from '@tanstack/react-query';
import { fetchPlanByInvite } from '../core/api';
import type { InvitePlanResponse } from '../core/schemas/invite';

export function useInvitePlan(planId: string, inviteToken: string) {
  return useQuery<InvitePlanResponse>({
    queryKey: ['invite', planId, inviteToken],
    queryFn: () => fetchPlanByInvite(planId, inviteToken),
    retry: false,
  });
}
