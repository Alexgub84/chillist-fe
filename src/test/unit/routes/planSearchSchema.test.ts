import { describe, it, expect } from 'vitest';
import { planSearchSchema } from '../../../core/schemas/plan-search';

describe('planSearchSchema', () => {
  it('parses a valid status', () => {
    const result = planSearchSchema.parse({ status: 'pending' });
    expect(result).toEqual({ status: 'pending' });
  });

  it('parses each valid status value', () => {
    const statuses = ['pending', 'purchased', 'packed', 'canceled'] as const;
    for (const status of statuses) {
      const result = planSearchSchema.parse({ status });
      expect(result).toEqual({ status });
    }
  });

  it('defaults to undefined when status is missing (show all)', () => {
    const result = planSearchSchema.parse({});
    expect(result).toEqual({ status: undefined });
  });

  it('defaults to undefined when status is undefined', () => {
    const result = planSearchSchema.parse({ status: undefined });
    expect(result).toEqual({ status: undefined });
  });

  it('defaults to undefined when status is null', () => {
    const result = planSearchSchema.parse({ status: null });
    expect(result).toEqual({ status: undefined });
  });

  it('defaults to undefined for an invalid status string', () => {
    const result = planSearchSchema.parse({ status: 'invalid' });
    expect(result).toEqual({ status: undefined });
  });

  it('defaults to undefined for a numeric status', () => {
    const result = planSearchSchema.parse({ status: 123 });
    expect(result).toEqual({ status: undefined });
  });

  it('ignores extra properties', () => {
    const result = planSearchSchema.parse({ status: 'packed', foo: 'bar' });
    expect(result.status).toBe('packed');
  });
});
