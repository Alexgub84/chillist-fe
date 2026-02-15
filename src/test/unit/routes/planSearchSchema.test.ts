import { describe, it, expect } from 'vitest';
import { planSearchSchema } from '../../../core/schemas/plan-search';

describe('planSearchSchema', () => {
  describe('status param', () => {
    it('parses a valid status', () => {
      const result = planSearchSchema.parse({ status: 'pending' });
      expect(result.status).toBe('pending');
    });

    it('parses each valid status value', () => {
      const statuses = ['pending', 'purchased', 'packed', 'canceled'] as const;
      for (const status of statuses) {
        const result = planSearchSchema.parse({ status });
        expect(result.status).toBe(status);
      }
    });

    it('defaults to undefined when status is missing', () => {
      const result = planSearchSchema.parse({});
      expect(result.status).toBeUndefined();
    });

    it('defaults to undefined when status is undefined', () => {
      const result = planSearchSchema.parse({ status: undefined });
      expect(result.status).toBeUndefined();
    });

    it('defaults to undefined when status is null', () => {
      const result = planSearchSchema.parse({ status: null });
      expect(result.status).toBeUndefined();
    });

    it('defaults to undefined for an invalid status string', () => {
      const result = planSearchSchema.parse({ status: 'invalid' });
      expect(result.status).toBeUndefined();
    });

    it('defaults to undefined for a numeric status', () => {
      const result = planSearchSchema.parse({ status: 123 });
      expect(result.status).toBeUndefined();
    });
  });

  describe('participant param', () => {
    it('parses a valid participant id string', () => {
      const result = planSearchSchema.parse({ participant: 'p-123' });
      expect(result.participant).toBe('p-123');
    });

    it('parses "unassigned" as a valid value', () => {
      const result = planSearchSchema.parse({ participant: 'unassigned' });
      expect(result.participant).toBe('unassigned');
    });

    it('defaults to undefined when participant is missing', () => {
      const result = planSearchSchema.parse({});
      expect(result.participant).toBeUndefined();
    });

    it('defaults to undefined when participant is undefined', () => {
      const result = planSearchSchema.parse({ participant: undefined });
      expect(result.participant).toBeUndefined();
    });

    it('defaults to undefined when participant is null', () => {
      const result = planSearchSchema.parse({ participant: null });
      expect(result.participant).toBeUndefined();
    });

    it('defaults to undefined for a numeric participant', () => {
      const result = planSearchSchema.parse({ participant: 123 });
      expect(result.participant).toBeUndefined();
    });
  });

  describe('combined params', () => {
    it('parses both status and participant together', () => {
      const result = planSearchSchema.parse({
        status: 'packed',
        participant: 'p-456',
      });
      expect(result.status).toBe('packed');
      expect(result.participant).toBe('p-456');
    });

    it('defaults both when empty object', () => {
      const result = planSearchSchema.parse({});
      expect(result.status).toBeUndefined();
      expect(result.participant).toBeUndefined();
    });

    it('ignores extra properties', () => {
      const result = planSearchSchema.parse({
        status: 'packed',
        participant: 'p-1',
        foo: 'bar',
      });
      expect(result.status).toBe('packed');
      expect(result.participant).toBe('p-1');
    });
  });
});
