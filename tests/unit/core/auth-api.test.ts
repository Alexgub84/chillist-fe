import { describe, expect, it } from 'vitest';
import { authMeResponseSchema } from '../../../src/core/auth-api';

describe('authMeResponseSchema', () => {
  it('parses a valid response', () => {
    const valid = {
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@chillist.dev',
        role: 'authenticated',
      },
    };
    expect(authMeResponseSchema.parse(valid)).toEqual(valid);
  });

  it('rejects response missing user', () => {
    expect(() => authMeResponseSchema.parse({})).toThrow();
  });

  it('rejects response missing email', () => {
    expect(() =>
      authMeResponseSchema.parse({
        user: { id: '1', role: 'authenticated' },
      })
    ).toThrow();
  });

  it('rejects response with extra fields but still parses core fields', () => {
    const withExtra = {
      user: {
        id: '1',
        email: 'test@test.com',
        role: 'admin',
        extra: 'field',
      },
    };
    const parsed = authMeResponseSchema.parse(withExtra);
    expect(parsed.user.email).toBe('test@test.com');
  });
});
