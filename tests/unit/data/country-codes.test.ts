import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  isValidE164,
  combinePhone,
} from '../../../src/data/country-codes';

describe('normalizePhone', () => {
  it('returns empty string for empty input', () => {
    expect(normalizePhone('IL', '')).toBe('');
    expect(normalizePhone('IL', '   ')).toBe('');
    expect(normalizePhone(undefined, '')).toBe('');
  });

  it('prepends dial code and strips leading zero for local numbers', () => {
    expect(normalizePhone('IL', '0501234567')).toBe('+972501234567');
    expect(normalizePhone('IL', '501234567')).toBe('+972501234567');
  });

  it('strips spaces, dashes, parentheses, and dots', () => {
    expect(normalizePhone('IL', '050-123-4567')).toBe('+972501234567');
    expect(normalizePhone('IL', '050 123 4567')).toBe('+972501234567');
    expect(normalizePhone('IL', '(050) 123-4567')).toBe('+972501234567');
    expect(normalizePhone('IL', '050.123.4567')).toBe('+972501234567');
  });

  it('uses full international number as-is when input starts with +', () => {
    expect(normalizePhone('IL', '+972501234567')).toBe('+972501234567');
    expect(normalizePhone('US', '+972501234567')).toBe('+972501234567');
    expect(normalizePhone('', '+14155551234')).toBe('+14155551234');
  });

  it('strips formatting from pasted international numbers', () => {
    expect(normalizePhone('IL', '+972-50-123-4567')).toBe('+972501234567');
    expect(normalizePhone('US', '+1 (415) 555-1234')).toBe('+14155551234');
  });

  it('returns raw cleaned number when no country code is selected', () => {
    expect(normalizePhone('', '0501234567')).toBe('0501234567');
    expect(normalizePhone(undefined, '0501234567')).toBe('0501234567');
  });

  it('handles US numbers with country code', () => {
    expect(normalizePhone('US', '4155551234')).toBe('+14155551234');
    expect(normalizePhone('US', '(415) 555-1234')).toBe('+14155551234');
  });
});

describe('isValidE164', () => {
  it('accepts valid E.164 numbers', () => {
    expect(isValidE164('+972501234567')).toBe(true);
    expect(isValidE164('+14155551234')).toBe(true);
    expect(isValidE164('+447911123456')).toBe(true);
    expect(isValidE164('+861012345678')).toBe(true);
  });

  it('rejects numbers without + prefix', () => {
    expect(isValidE164('972501234567')).toBe(false);
    expect(isValidE164('0501234567')).toBe(false);
  });

  it('rejects numbers starting with +0', () => {
    expect(isValidE164('+0501234567')).toBe(false);
  });

  it('rejects numbers that are too short (< 7 digits after +)', () => {
    expect(isValidE164('+12345')).toBe(false);
    expect(isValidE164('+123456')).toBe(false);
  });

  it('rejects numbers that are too long (> 15 digits after +)', () => {
    expect(isValidE164('+1234567890123456')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidE164('')).toBe(false);
  });

  it('rejects strings with non-digit chars after +', () => {
    expect(isValidE164('+972-50-1234567')).toBe(false);
    expect(isValidE164('+972 501234567')).toBe(false);
  });
});

describe('combinePhone (delegates to normalizePhone)', () => {
  it('normalizes local number with country code', () => {
    expect(combinePhone('IL', '050-123-4567')).toBe('+972501234567');
  });

  it('returns empty string for empty input', () => {
    expect(combinePhone('IL', '')).toBe('');
  });

  it('passes through international numbers', () => {
    expect(combinePhone('US', '+972501234567')).toBe('+972501234567');
  });
});
