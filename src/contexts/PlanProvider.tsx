import { useMemo, type ReactNode } from 'react';
import type { PlanWithDetails } from '../core/schemas/plan';
import {
  aggregateParticipantCounts,
  calculatePlanPoints,
  getDurationMultiplier,
} from '../core/utils-plan-points';
import { PlanContext } from './plan-context';

interface PlanProviderProps {
  plan: PlanWithDetails;
  children: ReactNode;
}

export default function PlanProvider({ plan, children }: PlanProviderProps) {
  const value = useMemo(() => {
    const { totalAdults, totalKids } = aggregateParticipantCounts(
      plan.participants
    );
    const durationMultiplier = getDurationMultiplier(
      plan.startDate,
      plan.endDate
    );
    const planPoints = calculatePlanPoints({
      adultsCount: totalAdults,
      kidsCount: totalKids,
      durationMultiplier,
    });
    return { plan, planPoints };
  }, [plan]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
