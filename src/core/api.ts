import { z } from 'zod';
import { planSchema, type Plan } from './schemas/plan';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    const error = new Error('API request failed') as Error & { status: number };
    error.status = response.status;
    try {
      const data = await response.json();
      if (data.message) error.message = data.message;
    } catch {
      // Ignore JSON parsing errors
    }
    throw error;
  }

  return response.json();
}

export async function fetchPlans(): Promise<Plan[]> {
  const data = await get<unknown>('/plans');
  return z.array(planSchema).parse(data);
}

export async function fetchPlan(planId: string): Promise<Plan> {
  const data = await get<unknown>(`/plan/${planId}`);
  return planSchema.parse(data);
}
