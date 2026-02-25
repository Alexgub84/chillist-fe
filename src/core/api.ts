import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { emitAuthError } from './auth-error';
import {
  itemCreateSchema,
  itemPatchSchema,
  itemSchema,
  type Item,
  type ItemCreate,
  type ItemPatch,
} from './schemas/item';
import {
  participantCreateSchema,
  participantPatchSchema,
  participantSchema,
  type Participant,
  type ParticipantCreate,
  type ParticipantPatch,
} from './schemas/participant';
import {
  planCreateSchema,
  planCreateWithOwnerSchema,
  planPatchSchema,
  planSchema,
  planWithDetailsSchema,
  type Plan,
  type PlanWithDetails,
  type PlanCreate,
  type PlanCreateWithOwner,
  type PlanPatch,
} from './schemas/plan';
import {
  invitePlanResponseSchema,
  type InvitePlanResponse,
} from './schemas/invite';

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3333';
}

function getApiKey() {
  return import.meta.env.VITE_API_KEY || '';
}

async function doFetch(
  endpoint: string,
  options?: RequestInit,
  accessToken?: string
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const apiKey = getApiKey();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string>),
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    return await fetch(url, { ...options, headers });
  } catch (err) {
    const method = options?.method || 'GET';
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[API] Network error — ${method} ${endpoint} (full URL: ${url}). Error: ${msg}`
    );
    throw new Error(`Network error: Unable to reach API at ${baseUrl}. ${msg}`);
  }
}

function parseErrorResponse(response: Response, url: string) {
  const error = new Error('API request failed') as Error & { status: number };
  error.status = response.status;
  return { error, url };
}

async function processResponse<T>(
  response: Response,
  endpoint: string
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const { error } = parseErrorResponse(response, url);
    if (isJson) {
      try {
        const data = await response.json();
        if (data.message) error.message = data.message;
      } catch {
        /* could not parse error body */
      }
    } else {
      error.message = `API returned ${response.status}: Expected JSON response from ${url} but received ${contentType || 'unknown content type'}`;
    }
    console.error(
      `[API] Request failed — ${endpoint} → ${response.status} ${response.statusText}. Message: "${error.message}"`
    );
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (!isJson) {
    console.error(
      `[API] Unexpected content type — ${endpoint} returned 200 but Content-Type="${contentType || 'missing'}". Expected application/json.`
    );
    throw new Error(
      `Invalid API response: Expected JSON from ${url} but received ${contentType || 'unknown content type'}. This usually means the API URL is misconfigured.`
    );
  }

  return response.json();
}

async function getAccessToken(): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await doFetch(endpoint, options, token);

  if (response.status === 401 && token) {
    console.warn(
      `[API] 401 Unauthorized on ${endpoint} — attempting token refresh…`
    );
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      const retryResponse = await doFetch(
        endpoint,
        options,
        data.session.access_token
      );
      if (retryResponse.status === 401) {
        console.error(
          `[API] 401 persisted after token refresh on ${endpoint} — emitting auth error (session expired).`
        );
        emitAuthError();
      }
      return processResponse<T>(retryResponse, endpoint);
    }
    console.error(
      `[API] Token refresh failed for ${endpoint} — ${error?.message ?? 'no session returned'}. Emitting auth error.`
    );
    emitAuthError();
  }

  return processResponse<T>(response, endpoint);
}

async function publicRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await doFetch(endpoint, options);
  return processResponse<T>(response, endpoint);
}

// --- Plans ---

export async function fetchPlans(): Promise<Plan[]> {
  const data = await request<unknown>('/plans');
  return z.array(planSchema).parse(data);
}

export async function fetchPlan(planId: string): Promise<PlanWithDetails> {
  const data = await request<unknown>(`/plans/${planId}`);
  return planWithDetailsSchema.parse(data);
}

export async function createPlan(plan: PlanCreate): Promise<Plan> {
  const validPlan = planCreateSchema.parse(plan);

  const data = await request<unknown>('/plans', {
    method: 'POST',
    body: JSON.stringify(validPlan),
  });
  return planSchema.parse(data);
}

export async function createPlanWithOwner(
  plan: PlanCreateWithOwner
): Promise<PlanWithDetails> {
  const validPlan = planCreateWithOwnerSchema.parse(plan);

  const data = await request<unknown>('/plans/with-owner', {
    method: 'POST',
    body: JSON.stringify(validPlan),
  });
  return planWithDetailsSchema.parse(data);
}

export async function updatePlan(
  planId: string,
  updates: PlanPatch
): Promise<Plan> {
  const validUpdates = planPatchSchema.parse(updates);

  const data = await request<unknown>(`/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(validUpdates),
  });
  return planSchema.parse(data);
}

export async function deletePlan(planId: string): Promise<void> {
  await request(`/plans/${planId}`, {
    method: 'DELETE',
  });
}

export async function fetchPlanByInvite(
  planId: string,
  inviteToken: string
): Promise<InvitePlanResponse> {
  const data = await publicRequest<unknown>(
    `/plans/${planId}/invite/${inviteToken}`
  );
  const result = invitePlanResponseSchema.safeParse(data);
  if (!result.success) {
    console.error(
      `[fetchPlanByInvite] Zod schema validation failed for planId="${planId}", inviteToken="${inviteToken.slice(0, 8)}…".\n` +
        `Issues: ${JSON.stringify(result.error.issues, null, 2)}\n` +
        `Raw BE response keys: ${JSON.stringify(Object.keys(data as Record<string, unknown>))}`
    );
    throw result.error;
  }
  return result.data;
}

export async function saveGuestPreferences(
  planId: string,
  inviteToken: string,
  preferences: {
    adultsCount?: number;
    kidsCount?: number;
    foodPreferences?: string;
    allergies?: string;
    notes?: string;
  }
): Promise<void> {
  await publicRequest(`/plans/${planId}/invite/${inviteToken}/preferences`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
}

export async function claimInvite(
  planId: string,
  inviteToken: string
): Promise<void> {
  await request(`/plans/${planId}/claim/${inviteToken}`, {
    method: 'POST',
  });
}

// --- Participants ---

export async function fetchParticipants(
  planId: string
): Promise<Participant[]> {
  const data = await request<unknown>(`/plans/${planId}/participants`);
  return z.array(participantSchema).parse(data);
}

export async function createParticipant(
  planId: string,
  participant: ParticipantCreate
): Promise<Participant> {
  const validParticipant = participantCreateSchema.parse(participant);

  const data = await request<unknown>(`/plans/${planId}/participants`, {
    method: 'POST',
    body: JSON.stringify(validParticipant),
  });
  return participantSchema.parse(data);
}

export async function fetchParticipant(
  participantId: string
): Promise<Participant> {
  const data = await request<unknown>(`/participants/${participantId}`);
  return participantSchema.parse(data);
}

export async function updateParticipant(
  participantId: string,
  updates: ParticipantPatch
): Promise<Participant> {
  // Validate input before sending
  const validUpdates = participantPatchSchema.parse(updates);

  const data = await request<unknown>(`/participants/${participantId}`, {
    method: 'PATCH',
    body: JSON.stringify(validUpdates),
  });
  return participantSchema.parse(data);
}

export async function deleteParticipant(participantId: string): Promise<void> {
  await request(`/participants/${participantId}`, {
    method: 'DELETE',
  });
}

// --- Items ---

export async function fetchItems(planId: string): Promise<Item[]> {
  const data = await request<unknown>(`/plans/${planId}/items`);
  return z.array(itemSchema).parse(data);
}

export async function createItem(
  planId: string,
  item: ItemCreate
): Promise<Item> {
  const validItem = itemCreateSchema.parse(item);

  const data = await request<unknown>(`/plans/${planId}/items`, {
    method: 'POST',
    body: JSON.stringify(validItem),
  });
  return itemSchema.parse(data);
}

export async function fetchItem(itemId: string): Promise<Item> {
  const data = await request<unknown>(`/items/${itemId}`);
  return itemSchema.parse(data);
}

export async function updateItem(
  itemId: string,
  updates: ItemPatch
): Promise<Item> {
  // Validate input before sending
  const validUpdates = itemPatchSchema.parse(updates);

  const data = await request<unknown>(`/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(validUpdates),
  });
  return itemSchema.parse(data);
}

export async function deleteItem(itemId: string): Promise<void> {
  await request(`/items/${itemId}`, {
    method: 'DELETE',
  });
}

// --- Auth ---

import { authMeResponseSchema, type AuthMeResponse } from './auth-api';

export type { AuthMeResponse };

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const data = await request<unknown>('/auth/me');
  return authMeResponseSchema.parse(data);
}
