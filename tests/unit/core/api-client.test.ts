import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createApiClient,
  getApiBaseUrl,
  getApiKey,
  handleResponse,
} from '../../../src/core/api-client';

function createMockResponse(
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    contentType?: string;
  } = {}
): Response {
  const {
    ok = true,
    status = 200,
    statusText = ok ? 'OK' : 'Error',
    contentType = 'application/json',
  } = options;
  return {
    ok,
    status,
    statusText,
    headers: new Headers({ 'content-type': contentType }),
  } as Response;
}

describe('OpenAPI Client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://api.test');
    vi.stubEnv('VITE_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getApiBaseUrl', () => {
    it('returns VITE_API_URL when set', () => {
      vi.stubEnv('VITE_API_URL', 'http://custom.api');
      expect(getApiBaseUrl()).toBe('http://custom.api');
    });

    it('returns default localhost when VITE_API_URL is not set', () => {
      vi.stubEnv('VITE_API_URL', '');
      expect(getApiBaseUrl()).toBe('http://localhost:3333');
    });
  });

  describe('getApiKey', () => {
    it('returns VITE_API_KEY when set', () => {
      vi.stubEnv('VITE_API_KEY', 'my-secret-key');
      expect(getApiKey()).toBe('my-secret-key');
    });

    it('returns empty string when VITE_API_KEY is not set', () => {
      vi.stubEnv('VITE_API_KEY', '');
      expect(getApiKey()).toBe('');
    });
  });

  describe('createApiClient', () => {
    it('creates client with custom fetch', () => {
      const customFetch = vi.fn();
      const client = createApiClient(customFetch);
      expect(client).toBeDefined();
      expect(client.GET).toBeDefined();
    });

    it('creates client without custom fetch', () => {
      const client = createApiClient();
      expect(client).toBeDefined();
    });
  });

  describe('handleResponse', () => {
    it('returns data when response is ok', () => {
      const mockData = [{ planId: 'plan-1', title: 'Test' }];
      const result = {
        data: mockData,
        error: undefined,
        response: createMockResponse(),
      };

      expect(handleResponse(result, '/plans')).toEqual(mockData);
    });

    it('throws ApiError when response is not ok', () => {
      const result = {
        data: undefined,
        error: { message: 'Not found' },
        response: createMockResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        }),
      };

      expect(() => handleResponse(result, '/plans')).toThrow(ApiError);
      expect(() => handleResponse(result, '/plans')).toThrow(
        'Failed to fetch /plans: 404 Not Found'
      );
    });

    it('throws ApiError with helpful message when API returns HTML', () => {
      const result = {
        data: undefined,
        error: { message: 'Parse error' },
        response: createMockResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          contentType: 'text/html',
        }),
      };

      expect(() => handleResponse(result, '/plans')).toThrow(ApiError);
      expect(() => handleResponse(result, '/plans')).toThrow(
        'Expected JSON from /plans but received text/html'
      );
    });

    it('throws ApiError on server error', () => {
      const result = {
        data: undefined,
        error: { message: 'Server error' },
        response: createMockResponse({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        }),
      };

      expect(() => handleResponse(result, '/plans')).toThrow(ApiError);

      try {
        handleResponse(result, '/plans');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(500);
        expect((e as ApiError).statusText).toBe('Internal Server Error');
      }
    });

    it('throws ApiError with unknown content type message', () => {
      const response = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers(),
      } as Response;

      const result = {
        data: undefined,
        error: { message: 'Gateway error' },
        response,
      };

      expect(() => handleResponse(result, '/health')).toThrow(
        'Expected JSON from /health but received unknown content type'
      );
    });
  });

  describe('ApiError', () => {
    it('has correct properties', () => {
      const error = new ApiError('Test error', 404, 'Not Found');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.name).toBe('ApiError');
      expect(error).toBeInstanceOf(Error);
    });

    it('is throwable and catchable', () => {
      const throwError = () => {
        throw new ApiError(
          'Something went wrong',
          500,
          'Internal Server Error'
        );
      };

      expect(throwError).toThrow(ApiError);
      expect(throwError).toThrow('Something went wrong');
    });
  });
});
