import { test as base, expect, type Page } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';

const API_PATTERN = '**/localhost:3333';

interface MockParticipant {
  participantId: string;
  planId: string;
  userId: string | null;
  name: string;
  lastName: string;
  contactPhone: string;
  displayName: string | null;
  role: string;
  avatarUrl: string | null;
  contactEmail: string | null;
  inviteToken: string | null;
  inviteStatus: string;
  rsvpStatus: string;
  lastActivityAt: string | null;
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
    userId?: string;
  }
): MockParticipant {
  return {
    participantId: randomUUID(),
    planId,
    userId: p.userId ?? null,
    name: p.name,
    lastName: p.lastName,
    contactPhone: p.phone ?? '555-0000',
    displayName: null,
    role: p.role ?? 'participant',
    avatarUrl: null,
    contactEmail: null,
    inviteToken: randomBytes(32).toString('hex'),
    inviteStatus: p.role === 'owner' ? 'accepted' : 'invited',
    rsvpStatus: p.role === 'owner' ? 'confirmed' : 'pending',
    lastActivityAt: null,
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
    userId?: string;
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
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ json: state });
    } else if (method === 'PATCH') {
      const updates = route.request().postDataJSON();
      Object.assign(state, updates, { updatedAt: timestamp() });
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

export async function injectAdminSession(page: Page) {
  await page.addInitScript(() => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'admin-user-id',
        email: 'admin@chillist.dev',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const token = `${header}.${payload}.mock-signature`;
    localStorage.setItem(
      'mock-auth-session',
      JSON.stringify({
        access_token: token,
        refresh_token: 'mock-refresh-admin',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'admin-user-id',
          email: 'admin@chillist.dev',
          user_metadata: { full_name: 'Admin User' },
          app_metadata: { role: 'admin' },
          aud: 'authenticated',
          role: 'authenticated',
        },
      })
    );
  });
}

export async function injectUserSession(page: Page) {
  await page.addInitScript(() => {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'regular-user-id',
        email: 'user@chillist.dev',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const token = `${header}.${payload}.mock-signature`;
    localStorage.setItem(
      'mock-auth-session',
      JSON.stringify({
        access_token: token,
        refresh_token: 'mock-refresh-user',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'regular-user-id',
          email: 'user@chillist.dev',
          user_metadata: { full_name: 'Regular User' },
          app_metadata: {},
          aud: 'authenticated',
          role: 'authenticated',
        },
      })
    );
  });
}

export async function mockPlansListRoutes(page: Page, plans: MockPlan[] = []) {
  const planSummaries = plans.map((plan) => {
    const { items, participants, ...summary } = plan;
    void items;
    void participants;
    return summary;
  });

  for (const plan of plans) {
    await page.route(`${API_PATTERN}/plans/${plan.planId}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        const index = planSummaries.findIndex((p) => p.planId === plan.planId);
        if (index !== -1) {
          planSummaries.splice(index, 1);
        }
        await route.fulfill({ json: { ok: true } });
      } else {
        await route.continue();
      }
    });
  }

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

export async function mockInviteRoute(
  page: Page,
  plan: MockPlan,
  inviteToken: string
) {
  const strippedParticipants = plan.participants.map((p) => ({
    participantId: p.participantId,
    displayName: p.displayName ?? `${p.name} ${p.lastName}`,
    role: p.role,
  }));

  await page.route(
    `${API_PATTERN}/plans/${plan.planId}/invite/${inviteToken}`,
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            planId: plan.planId,
            title: plan.title,
            description: plan.description,
            status: plan.status,
            location: null,
            startDate: plan.startDate,
            endDate: plan.endDate,
            tags: plan.tags,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
            items: plan.items,
            participants: strippedParticipants,
          },
        });
      } else {
        await route.continue();
      }
    }
  );

  await page.route(
    `${API_PATTERN}/plans/${plan.planId}/invite/invalid-token-*`,
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          json: { message: 'Invalid or expired invite link' },
        });
      } else {
        await route.continue();
      }
    }
  );
}

const test = base;

export { test, expect, type Page, type MockPlan };
