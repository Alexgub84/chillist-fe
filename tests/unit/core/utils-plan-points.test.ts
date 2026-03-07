import { describe, it, expect } from 'vitest';
import {
  getDurationMultiplier,
  aggregateParticipantCounts,
  calculatePlanPoints,
  calculateSuggestedQuantity,
} from '../../../src/core/utils-plan-points';

describe('getDurationMultiplier', () => {
  it('returns 1 when dates are missing', () => {
    expect(getDurationMultiplier(null, null)).toBe(1);
    expect(getDurationMultiplier(undefined, undefined)).toBe(1);
    expect(getDurationMultiplier('2026-03-01T10:00:00Z', null)).toBe(1);
    expect(getDurationMultiplier(null, '2026-03-01T14:00:00Z')).toBe(1);
  });

  it('returns 1 for invalid date strings', () => {
    expect(getDurationMultiplier('bad', 'worse')).toBe(1);
  });

  it('returns 1 when end is before start', () => {
    expect(
      getDurationMultiplier('2026-03-01T14:00:00Z', '2026-03-01T10:00:00Z')
    ).toBe(1);
  });

  it('returns 1 for 0-4 hour events', () => {
    expect(
      getDurationMultiplier('2026-03-01T10:00:00Z', '2026-03-01T12:00:00Z')
    ).toBe(1);
    expect(
      getDurationMultiplier('2026-03-01T10:00:00Z', '2026-03-01T14:00:00Z')
    ).toBe(1);
  });

  it('returns 1.5 for 4-7 hour events', () => {
    expect(
      getDurationMultiplier('2026-03-01T10:00:00Z', '2026-03-01T15:00:00Z')
    ).toBe(1.5);
    expect(
      getDurationMultiplier('2026-03-01T10:00:00Z', '2026-03-01T17:00:00Z')
    ).toBe(1.5);
  });

  it('returns 2 for 7-12 hour events', () => {
    expect(
      getDurationMultiplier('2026-03-01T08:00:00Z', '2026-03-01T16:00:00Z')
    ).toBe(2);
    expect(
      getDurationMultiplier('2026-03-01T08:00:00Z', '2026-03-01T20:00:00Z')
    ).toBe(2);
  });

  it('returns 3 for events longer than 12 hours', () => {
    expect(
      getDurationMultiplier('2026-03-01T08:00:00Z', '2026-03-02T08:00:00Z')
    ).toBe(3);
    expect(
      getDurationMultiplier('2026-03-01T08:00:00Z', '2026-03-03T08:00:00Z')
    ).toBe(3);
  });
});

describe('aggregateParticipantCounts', () => {
  it('returns zeros for empty array', () => {
    expect(aggregateParticipantCounts([])).toEqual({
      totalAdults: 0,
      totalKids: 0,
    });
  });

  it('sums adults and kids across participants', () => {
    const participants = [
      { adultsCount: 2, kidsCount: 1 },
      { adultsCount: 3, kidsCount: 2 },
    ];
    expect(aggregateParticipantCounts(participants)).toEqual({
      totalAdults: 5,
      totalKids: 3,
    });
  });

  it('treats null/undefined counts as 0', () => {
    const participants = [
      { adultsCount: null, kidsCount: undefined },
      { adultsCount: 2, kidsCount: null },
    ];
    expect(aggregateParticipantCounts(participants)).toEqual({
      totalAdults: 2,
      totalKids: 0,
    });
  });
});

describe('calculatePlanPoints', () => {
  it('computes points from adults only', () => {
    expect(
      calculatePlanPoints({
        adultsCount: 4,
        kidsCount: 0,
        durationMultiplier: 1,
      })
    ).toBe(4);
  });

  it('weights kids at 0.5', () => {
    expect(
      calculatePlanPoints({
        adultsCount: 2,
        kidsCount: 4,
        durationMultiplier: 1,
      })
    ).toBe(4);
  });

  it('applies duration multiplier', () => {
    expect(
      calculatePlanPoints({
        adultsCount: 4,
        kidsCount: 2,
        durationMultiplier: 2,
      })
    ).toBe(10);
  });

  it('returns 0 when no participants', () => {
    expect(
      calculatePlanPoints({
        adultsCount: 0,
        kidsCount: 0,
        durationMultiplier: 3,
      })
    ).toBe(0);
  });
});

describe('calculateSuggestedQuantity', () => {
  it('returns 1 for personal items', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: 0.5,
        isPersonal: true,
      })
    ).toBe(1);
  });

  it('returns 1 when quantityPerPoint is null', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: null,
        isPersonal: false,
      })
    ).toBe(1);
  });

  it('returns 1 when quantityPerPoint is undefined', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: undefined,
        isPersonal: undefined,
      })
    ).toBe(1);
  });

  it('returns 1 when quantityPerPoint is 0', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: 0,
        isPersonal: false,
      })
    ).toBe(1);
  });

  it('ceils the result', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: 0.15,
        isPersonal: false,
      })
    ).toBe(2);
  });

  it('computes correctly for beverages', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 10,
        quantityPerPoint: 0.5,
        isPersonal: false,
      })
    ).toBe(5);
  });

  it('returns minimum of 1 even for tiny planPoints', () => {
    expect(
      calculateSuggestedQuantity({
        planPoints: 0.1,
        quantityPerPoint: 0.05,
        isPersonal: false,
      })
    ).toBe(1);
  });
});
