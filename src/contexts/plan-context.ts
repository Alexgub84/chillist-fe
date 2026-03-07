import { createContext } from 'react';
import type { PlanWithDetails } from '../core/schemas/plan';
import {
  isSupportedLanguage,
  SUPPORTED_CURRENCIES,
  type AppLanguage,
} from './language-context';

export interface PlanContextValue {
  plan: PlanWithDetails;
  planPoints: number;
  planLanguage: AppLanguage;
  planCurrency: string;
}

export const PlanContext = createContext<PlanContextValue | null>(null);

export function resolvePlanLanguage(
  defaultLang: string | null | undefined,
  fallback: AppLanguage
): AppLanguage {
  if (defaultLang && isSupportedLanguage(defaultLang)) return defaultLang;
  return fallback;
}

export function resolvePlanCurrency(
  currency: string | null | undefined,
  fallback: string
): string {
  if (currency && SUPPORTED_CURRENCIES.some((c) => c.code === currency))
    return currency;
  return fallback;
}
