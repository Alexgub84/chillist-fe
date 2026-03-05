import { useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import type { PlanWithDetails } from '../core/schemas/plan';
import type { Participant } from '../core/schemas/participant';
import type { Item } from '../core/schemas/item';
import { isAssignedTo } from '../core/utils-plan-items';

interface PlanRole {
  isOwner: boolean;
  currentParticipant: Participant | undefined;
  canEditItem: ((item: Item) => boolean) | undefined;
}

export function usePlanRole(plan: PlanWithDetails): PlanRole {
  const { user } = useAuth();

  return useMemo(() => {
    const isOwner =
      !!user &&
      plan.participants.some((p) => p.role === 'owner' && p.userId === user.id);

    const currentParticipant = user
      ? plan.participants.find((p) => p.userId === user.id)
      : undefined;

    const canEditItem = isOwner
      ? undefined
      : (item: Item) =>
          !!currentParticipant &&
          isAssignedTo(item, currentParticipant.participantId);

    return { isOwner, currentParticipant, canEditItem };
  }, [user, plan.participants]);
}
