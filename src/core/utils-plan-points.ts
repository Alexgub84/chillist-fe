import type { Participant } from './schemas/participant';

const DURATION_BRACKETS: [maxHours: number, multiplier: number][] = [
  [4, 1],
  [7, 1.5],
  [12, 2],
];
const LONG_EVENT_MULTIPLIER = 3;
const KIDS_WEIGHT = 0.5;

export function getDurationMultiplier(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;

  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (hours <= 0) return 1;

  for (const [maxHours, multiplier] of DURATION_BRACKETS) {
    if (hours <= maxHours) return multiplier;
  }
  return LONG_EVENT_MULTIPLIER;
}

export function aggregateParticipantCounts(
  participants: Pick<Participant, 'adultsCount' | 'kidsCount'>[]
): { totalAdults: number; totalKids: number } {
  let totalAdults = 0;
  let totalKids = 0;
  for (const p of participants) {
    totalAdults += p.adultsCount ?? 0;
    totalKids += p.kidsCount ?? 0;
  }
  return { totalAdults, totalKids };
}

export function calculatePlanPoints(params: {
  adultsCount: number;
  kidsCount: number;
  durationMultiplier: number;
}): number {
  return (
    (params.adultsCount + params.kidsCount * KIDS_WEIGHT) *
    params.durationMultiplier
  );
}

export function calculateSuggestedQuantity(params: {
  planPoints: number;
  quantityPerPoint: number | null | undefined;
  isPersonal: boolean | undefined;
}): number {
  if (params.isPersonal) return 1;
  if (!params.quantityPerPoint) return 1;
  return Math.max(1, Math.ceil(params.planPoints * params.quantityPerPoint));
}
