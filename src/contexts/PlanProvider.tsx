import { useMemo, type ReactNode } from 'react';
import type { PlanWithDetails } from '../core/schemas/plan';
import {
  aggregateParticipantCounts,
  calculatePlanPoints,
  getDurationMultiplier,
} from '../core/utils-plan-points';
import { getCurrency } from './language-context';
import { useLanguage } from './useLanguage';
import {
  PlanContext,
  resolvePlanLanguage,
  resolvePlanCurrency,
} from './plan-context';
import {
  DEFAULT_PLAN_LANGUAGE,
  DEFAULT_PLAN_CURRENCY,
} from './language-context';

interface PlanProviderProps {
  plan: PlanWithDetails;
  children: ReactNode;
}

export default function PlanProvider({ plan, children }: PlanProviderProps) {
  const { language } = useLanguage();
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
    const planLanguage = resolvePlanLanguage(
      plan.defaultLang,
      language ?? DEFAULT_PLAN_LANGUAGE
    );
    const planCurrency = resolvePlanCurrency(
      plan.currency,
      getCurrency(planLanguage) ?? DEFAULT_PLAN_CURRENCY
    );
    return { plan, planPoints, planLanguage, planCurrency };
  }, [plan, language]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
