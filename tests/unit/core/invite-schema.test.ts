import { describe, it, expect } from 'vitest';
import {
  inviteParticipantSchema,
  invitePlanResponseSchema,
} from '../../../src/core/schemas/invite';

describe('inviteParticipantSchema', () => {
  it('parses a valid invite participant', () => {
    const result = inviteParticipantSchema.parse({
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Alex S.',
      role: 'owner',
    });

    expect(result.participantId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.displayName).toBe('Alex S.');
    expect(result.role).toBe('owner');
  });

  it('accepts null displayName', () => {
    const result = inviteParticipantSchema.parse({
      participantId: '550e8400-e29b-41d4-a716-446655440000',
      displayName: null,
      role: 'participant',
    });

    expect(result.displayName).toBeNull();
  });

  it('rejects invalid role', () => {
    expect(() =>
      inviteParticipantSchema.parse({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        displayName: 'Test',
        role: 'admin',
      })
    ).toThrow();
  });
});

describe('invitePlanResponseSchema', () => {
  const validResponse = {
    planId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Beach Trip',
    description: 'Fun day out',
    status: 'active',
    location: null,
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-07-03T00:00:00Z',
    tags: ['beach', 'summer'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    items: [
      {
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        planId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Sunscreen',
        category: 'equipment',
        quantity: 1,
        unit: 'pcs',
        status: 'pending',
        notes: null,
        assignedParticipantId: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    participants: [
      {
        participantId: '550e8400-e29b-41d4-a716-446655440002',
        displayName: 'Alex S.',
        role: 'owner',
      },
    ],
  };

  it('parses a valid invite plan response', () => {
    const result = invitePlanResponseSchema.parse(validResponse);

    expect(result.planId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.title).toBe('Beach Trip');
    expect(result.items).toHaveLength(1);
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].displayName).toBe('Alex S.');
  });

  it('accepts null description', () => {
    const result = invitePlanResponseSchema.parse({
      ...validResponse,
      description: null,
    });

    expect(result.description).toBeNull();
  });

  it('rejects missing title', () => {
    const { title: _, ...noTitle } = validResponse;
    void _;
    expect(() => invitePlanResponseSchema.parse(noTitle)).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() =>
      invitePlanResponseSchema.parse({ ...validResponse, status: 'unknown' })
    ).toThrow();
  });

  it('accepts dates without timezone designator (BE format)', () => {
    const result = invitePlanResponseSchema.safeParse({
      ...validResponse,
      startDate: '2026-07-01T00:00:00',
      endDate: '2026-07-03T00:00:00',
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      items: [
        {
          ...validResponse.items[0],
          createdAt: '2026-01-01T00:00:00',
          updatedAt: '2026-01-01T00:00:00',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts dates with timezone offset (+03:00)', () => {
    const result = invitePlanResponseSchema.safeParse({
      ...validResponse,
      createdAt: '2026-01-01T03:00:00+03:00',
      updatedAt: '2026-01-01T03:00:00+03:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts dates with milliseconds', () => {
    const result = invitePlanResponseSchema.safeParse({
      ...validResponse,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.123456Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts dates with microsecond precision from PostgreSQL', () => {
    const result = invitePlanResponseSchema.safeParse({
      ...validResponse,
      createdAt: '2026-01-01T00:00:00.123456',
      updatedAt: '2026-01-01T00:00:00.654321+00:00',
      items: [
        {
          ...validResponse.items[0],
          createdAt: '2026-01-01T00:00:00.123456',
          updatedAt: '2026-01-01T00:00:00.654321',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('still rejects non-string dates', () => {
    expect(() =>
      invitePlanResponseSchema.parse({ ...validResponse, createdAt: 12345 })
    ).toThrow();
  });
});
