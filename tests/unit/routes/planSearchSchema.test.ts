import { describe, it, expect } from 'vitest';
import { planSearchSchema } from '../../../src/core/schemas/plan-search';

describe('planSearchSchema', () => {
  describe('list param', () => {
    it('parses "buying"', () => {
      const result = planSearchSchema.parse({ list: 'buying' });
      expect(result.list).toBe('buying');
    });

    it('parses "packing"', () => {
      const result = planSearchSchema.parse({ list: 'packing' });
      expect(result.list).toBe('packing');
    });

    it('defaults to undefined when list is missing', () => {
      const result = planSearchSchema.parse({});
      expect(result.list).toBeUndefined();
    });

    it('defaults to undefined when list is undefined', () => {
      const result = planSearchSchema.parse({ list: undefined });
      expect(result.list).toBeUndefined();
    });

    it('defaults to undefined when list is null', () => {
      const result = planSearchSchema.parse({ list: null });
      expect(result.list).toBeUndefined();
    });

    it('defaults to undefined for an invalid list string', () => {
      const result = planSearchSchema.parse({ list: 'invalid' });
      expect(result.list).toBeUndefined();
    });

    it('defaults to undefined for a numeric list', () => {
      const result = planSearchSchema.parse({ list: 123 });
      expect(result.list).toBeUndefined();
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
    it('parses both list and participant together', () => {
      const result = planSearchSchema.parse({
        list: 'packing',
        participant: 'p-456',
      });
      expect(result.list).toBe('packing');
      expect(result.participant).toBe('p-456');
    });

    it('defaults both when empty object', () => {
      const result = planSearchSchema.parse({});
      expect(result.list).toBeUndefined();
      expect(result.participant).toBeUndefined();
    });

    it('ignores extra properties', () => {
      const result = planSearchSchema.parse({
        list: 'buying',
        participant: 'p-1',
        foo: 'bar',
      });
      expect(result.list).toBe('buying');
      expect(result.participant).toBe('p-1');
    });
  });
});
