import { test as base, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const API_PATTERN = '**/localhost:3333';

interface MockParticipant {
  participantId: string;
  planId: string;
  name: string;
  lastName: string;
  contactPhone: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  contactEmail: string | null;
  adultsCount: number | null;
  kidsCount: number | null;
  foodPreferences: string | null;
  allergies: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockItem {
  itemId: string;
  planId: string;
  name: string;
  category: 'equipment' | 'food';
  quantity: number;
  unit: string;
  status: string;
  notes: string | null;
  assignedParticipantId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockPlan {
  planId: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  ownerParticipantId: string | null;
  participantIds: string[];
  startDate: string | null;
  endDate: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  items: MockItem[];
  participants: MockParticipant[];
}

function timestamp() {
  return new Date().toISOString();
}

export function buildParticipant(
  planId: string,
  p: {
    name: string;
    lastName: string;
    phone?: string;
    role?: string;
  }
): MockParticipant {
  return {
    participantId: randomUUID(),
    planId,
    name: p.name,
    lastName: p.lastName,
    contactPhone: p.phone ?? '555-0000',
    displayName: null,
    role: p.role ?? 'participant',
    avatarUrl: null,
    contactEmail: null,
    adultsCount: null,
    kidsCount: null,
    foodPreferences: null,
    allergies: null,
    notes: null,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

export function buildItem(
  planId: string,
  i: {
    name: string;
    category: 'equipment' | 'food';
    quantity: number;
    status?: string;
    assignedParticipantId?: string | null;
    notes?: string | null;
  }
): MockItem {
  return {
    itemId: randomUUID(),
    planId,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: 'pcs',
    status: i.status ?? 'pending',
    notes: i.notes ?? null,
    assignedParticipantId: i.assignedParticipantId ?? null,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

export function buildPlan(opts?: {
  title?: string;
  participants?: Array<{
    name: string;
    lastName: string;
    phone?: string;
    role?: string;
  }>;
  items?: Array<{
    name: string;
    category: 'equipment' | 'food';
    quantity: number;
    status?: string;
    assignedParticipantId?: string | null;
    notes?: string | null;
  }>;
}): MockPlan {
  const planId = randomUUID();
  const participants = (opts?.participants ?? []).map((p) =>
    buildParticipant(planId, p)
  );
  const items = (opts?.items ?? []).map((i) => buildItem(planId, i));

  return {
    planId,
    title: opts?.title ?? 'Test Plan',
    description: null,
    status: 'draft',
    visibility: 'private',
    ownerParticipantId:
      participants.find((p) => p.role === 'owner')?.participantId ?? null,
    participantIds: participants.map((p) => p.participantId),
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-03T00:00:00.000Z',
    tags: null,
    createdAt: timestamp(),
    updatedAt: timestamp(),
    items,
    participants,
  };
}

export async function mockPlanRoutes(page: Page, plan: MockPlan) {
  const state = structuredClone(plan);

  await page.route(`${API_PATTERN}/plans/${state.planId}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: state });
    } else {
      await route.continue();
    }
  });

  await page.route(
    `${API_PATTERN}/plans/${state.planId}/items`,
    async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newItem = buildItem(state.planId, body);
        state.items.push(newItem);
        await route.fulfill({ json: newItem, status: 201 });
      } else {
        await route.continue();
      }
    }
  );

  await page.route(
    `${API_PATTERN}/plans/${state.planId}/participants`,
    async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newParticipant = buildParticipant(state.planId, body);
        state.participants.push(newParticipant);
        state.participantIds.push(newParticipant.participantId);
        await route.fulfill({ json: newParticipant, status: 201 });
      } else {
        await route.continue();
      }
    }
  );

  await page.route(`${API_PATTERN}/participants/*`, async (route) => {
    if (route.request().method() === 'PATCH') {
      const url = route.request().url();
      const participantId = url.split('/participants/')[1].split('?')[0];
      const updates = route.request().postDataJSON();
      const participant = state.participants.find(
        (p) => p.participantId === participantId
      );
      if (participant) {
        Object.assign(participant, updates, { updatedAt: timestamp() });
        await route.fulfill({ json: participant });
      } else {
        await route.fulfill({ status: 404, json: { message: 'Not found' } });
      }
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_PATTERN}/items/*`, async (route) => {
    if (route.request().method() === 'PATCH') {
      const url = route.request().url();
      const itemId = url.split('/items/')[1].split('?')[0];
      const updates = route.request().postDataJSON();
      const item = state.items.find((i) => i.itemId === itemId);
      if (item) {
        Object.assign(item, updates, { updatedAt: timestamp() });
        await route.fulfill({ json: item });
      } else {
        await route.fulfill({ status: 404, json: { message: 'Not found' } });
      }
    } else {
      await route.continue();
    }
  });

  return state;
}

export async function mockPlansListRoutes(page: Page, plans: MockPlan[] = []) {
  const planSummaries = plans.map((plan) => {
    const { items, participants, ...summary } = plan;
    void items;
    void participants;
    return summary;
  });

  await page.route(`${API_PATTERN}/plans`, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ json: planSummaries });
    } else if (method === 'POST') {
      const body = route.request().postDataJSON();
      const newPlan = buildPlan({ title: body.title });
      planSummaries.push({
        planId: newPlan.planId,
        title: newPlan.title,
        description: newPlan.description,
        status: newPlan.status,
        visibility: newPlan.visibility,
        ownerParticipantId: newPlan.ownerParticipantId,
        participantIds: newPlan.participantIds,
        startDate: newPlan.startDate,
        endDate: newPlan.endDate,
        tags: newPlan.tags,
        createdAt: newPlan.createdAt,
        updatedAt: newPlan.updatedAt,
      });
      await route.fulfill({ json: newPlan, status: 201 });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_PATTERN}/plans/with-owner`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const participants = [
        {
          name: body.owner.name,
          lastName: body.owner.lastName,
          phone: body.owner.contactPhone,
          role: 'owner',
        },
        ...(body.participants ?? []).map(
          (p: { name: string; lastName: string; contactPhone: string }) => ({
            name: p.name,
            lastName: p.lastName,
            phone: p.contactPhone,
          })
        ),
      ];
      const newPlan = buildPlan({ title: body.title, participants });
      await mockPlanRoutes(page, newPlan);
      await route.fulfill({ json: newPlan, status: 201 });
    } else {
      await route.continue();
    }
  });
}

const test = base;

export { test, expect, type Page };
