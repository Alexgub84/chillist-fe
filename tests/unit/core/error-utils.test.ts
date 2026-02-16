import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '../../../src/core/error-utils';
import { ApiError } from '../../../src/core/api-client';

describe('error-utils', () => {
  describe('getApiErrorMessage', () => {
    it('returns friendly message for network errors', () => {
      const error = new Error('Network error: Unable to reach API');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Connection Problem');
      expect(result.message).toContain('internet connection');
      expect(result.canRetry).toBe(true);
    });

    it('returns friendly message for fetch errors', () => {
      const error = new Error('fetch failed');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Connection Problem');
      expect(result.canRetry).toBe(true);
    });

    it('returns friendly message for non-JSON response', () => {
      const error = new Error(
        'Expected JSON from /plans but received text/html'
      );
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Server Configuration Error');
      expect(result.canRetry).toBe(true);
    });

    it('returns friendly message for 401 Unauthorized', () => {
      const error = new ApiError('Unauthorized', 401, 'Unauthorized');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Authentication Required');
      expect(result.canRetry).toBe(false);
    });

    it('returns friendly message for 403 Forbidden', () => {
      const error = new ApiError('Forbidden', 403, 'Forbidden');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Access Denied');
      expect(result.canRetry).toBe(false);
    });

    it('returns friendly message for 404 Not Found', () => {
      const error = new ApiError('Not found', 404, 'Not Found');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Not Found');
      expect(result.canRetry).toBe(false);
    });

    it('returns friendly message for 500 Server Error', () => {
      const error = new ApiError(
        'Internal server error',
        500,
        'Internal Server Error'
      );
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Server Error');
      expect(result.message).toContain('our end');
      expect(result.canRetry).toBe(true);
    });

    it('returns friendly message for 503 Service Unavailable', () => {
      const error = new ApiError(
        'Service unavailable',
        503,
        'Service Unavailable'
      );
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Service Unavailable');
      expect(result.canRetry).toBe(true);
    });

    it('returns friendly message for 429 Rate Limit', () => {
      const error = new ApiError('Too many requests', 429, 'Too Many Requests');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.canRetry).toBe(true);
    });

    it('returns generic message for unknown errors', () => {
      const error = new Error('Something weird happened');
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Something Went Wrong');
      expect(result.canRetry).toBe(true);
    });

    it('returns generic message for unknown status codes', () => {
      const error = new ApiError('Teapot', 418, "I'm a teapot");
      const result = getApiErrorMessage(error);

      expect(result.title).toBe('Error');
      expect(result.canRetry).toBe(true);
    });
  });
});
