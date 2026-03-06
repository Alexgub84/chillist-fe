import { createContext } from 'react';
import type { PlanWithDetails } from '../core/schemas/plan';

export interface PlanContextValue {
  plan: PlanWithDetails;
  planPoints: number;
}

export const PlanContext = createContext<PlanContextValue | null>(null);
