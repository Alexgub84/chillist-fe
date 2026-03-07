import { useContext } from 'react';
import { PlanContext, type PlanContextValue } from '../contexts/plan-context';

export function usePlanContext(): PlanContextValue | null {
  return useContext(PlanContext);
}
