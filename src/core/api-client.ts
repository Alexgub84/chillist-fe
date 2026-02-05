import createClient from 'openapi-fetch';
import type { paths } from './api.generated';

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3333';
}

export function getApiKey() {
  return import.meta.env.VITE_API_KEY || '';
}

export function createApiClient(customFetch?: typeof fetch) {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();

  const options: Parameters<typeof createClient<paths>>[0] = {
    baseUrl,
    headers: apiKey ? { 'x-api-key': apiKey } : {},
  };

  if (customFetch) {
    options.fetch = customFetch;
  }

  return createClient<paths>(options);
}

export const client = createApiClient();

interface ApiResponse<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

export function handleResponse<T>(result: ApiResponse<T>, endpoint: string): T {
  const { data, error, response } = result;

  if (!response.ok || error) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson && response.ok === false) {
      throw new ApiError(
        `API returned ${response.status}: Expected JSON from ${endpoint} but received ${contentType || 'unknown content type'}. Check if API URL is correct.`,
        response.status,
        response.statusText
      );
    }

    throw new ApiError(
      `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return data as T;
}

export async function fetchPlansFromOpenAPI() {
  const result = await client.GET('/plans');
  return handleResponse(result, '/plans');
}

export async function checkHealth() {
  const result = await client.GET('/health');
  return handleResponse(result, '/health');
}
