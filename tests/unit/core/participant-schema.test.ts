import { describe, it, expect } from 'vitest';
import { participantSchema } from '../../../src/core/schemas/participant';

describe('participantSchema date-time validation', () => {
  const validParticipant = {
    participantId: 'p-1',
    planId: 'plan-1',
    name: 'Test',
    lastName: 'User',
    contactPhone: '+1234567890',
    displayName: 'Test User',
    role: 'owner' as const,
    rsvpStatus: 'pending' as const,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('accepts valid participant with RFC 3339 timestamps', () => {
    const result = participantSchema.safeParse(validParticipant);
    expect(result.success).toBe(true);
  });

  it('rejects createdAt without timezone designator', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      createdAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects updatedAt without timezone designator', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      updatedAt: '2025-01-01T00:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null for nullable optional fields', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      avatarUrl: null,
      contactEmail: null,
      displayName: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid email and URL formats', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      avatarUrl: 'https://example.com/avatar.png',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('accepts any string for contactEmail (no format constraint in OpenAPI)', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      contactEmail: 'not-an-email',
    });
    expect(result.success).toBe(true);
  });

  it('accepts any string for avatarUrl (no format constraint in OpenAPI)', () => {
    const result = participantSchema.safeParse({
      ...validParticipant,
      avatarUrl: 'not-a-url',
    });
    expect(result.success).toBe(true);
  });
});
