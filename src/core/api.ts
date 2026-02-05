import { z } from 'zod';
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
  planSchema,
  type Plan,
  type PlanCreate,
  type PlanPatch,
} from './schemas/plan';

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3333';
}

function getApiKey() {
  return import.meta.env.VITE_API_KEY || '';
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const apiKey = getApiKey();
  const url = `${baseUrl}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (apiKey) {
    (headers as Record<string, string>)['x-api-key'] = apiKey;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error(
      `Network error: Unable to reach API at ${baseUrl}. ${err instanceof Error ? err.message : ''}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const error = new Error('API request failed') as Error & {
      status: number;
    };
    error.status = response.status;
    if (isJson) {
      try {
        const data = await response.json();
        if (data.message) error.message = data.message;
      } catch {
        // Ignore JSON parsing errors
      }
    } else {
      error.message = `API returned ${response.status}: Expected JSON response from ${url} but received ${contentType || 'unknown content type'}`;
    }
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (!isJson) {
    throw new Error(
      `Invalid API response: Expected JSON from ${url} but received ${contentType || 'unknown content type'}. This usually means the API URL is misconfigured.`
    );
  }

  return response.json();
}

// --- Plans ---

export async function fetchPlans(): Promise<Plan[]> {
  const data = await request<unknown>('/plans');
  return z.array(planSchema).parse(data);
}

export async function fetchPlan(planId: string): Promise<Plan> {
  const data = await request<unknown>(`/plan/${planId}`);
  return planSchema.parse(data);
}

export async function createPlan(plan: PlanCreate): Promise<Plan> {
  const data = await request<unknown>('/plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
  return planSchema.parse(data);
}

export async function updatePlan(
  planId: string,
  updates: PlanPatch
): Promise<Plan> {
  const data = await request<unknown>(`/plan/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return planSchema.parse(data);
}

export async function deletePlan(planId: string): Promise<void> {
  await request(`/plan/${planId}`, {
    method: 'DELETE',
  });
}

// --- Participants ---

export async function fetchParticipants(
  planId: string
): Promise<Participant[]> {
  const data = await request<unknown>(`/plan/${planId}/participants`);
  return z.array(participantSchema).parse(data);
}

export async function createParticipant(
  planId: string,
  participant: ParticipantCreate
): Promise<Participant> {
  // Validate input before sending
  const validParticipant = participantCreateSchema.parse(participant);

  const data = await request<unknown>(`/plan/${planId}/participants`, {
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
  const data = await request<unknown>(`/plan/${planId}/items`);
  return z.array(itemSchema).parse(data);
}

export async function createItem(
  planId: string,
  item: ItemCreate
): Promise<Item> {
  // Validate input before sending
  const validItem = itemCreateSchema.parse(item);

  const data = await request<unknown>(`/plan/${planId}/items`, {
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
