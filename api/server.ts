import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

import type { Plan } from '../src/core/types/plan';
import type { Participant } from '../src/core/types/participant';
import type { Item } from '../src/core/types/item';
import {
  DEFAULT_MOCK_DATA_PATH,
  loadMockData,
  saveMockData,
  type MockData,
} from './mock';

class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function statusColor(code: number): string {
  if (code >= 400) return '\x1b[31m';
  if (code >= 300) return '\x1b[33m';
  return '\x1b[32m';
}

const planStatusSchema = z.enum(['draft', 'active', 'archived']);
const planVisibilitySchema = z.enum(['public', 'invite_only', 'private']);
const itemStatusSchema = z.enum(['pending', 'purchased', 'packed', 'canceled']);
const itemCategorySchema = z.enum(['equipment', 'food']);
const unitSchema = z.enum([
  'pcs',
  'kg',
  'g',
  'lb',
  'oz',
  'l',
  'ml',
  'm',
  'cm',
  'pack',
  'set',
]);

const locationSchema = z.object({
  locationId: z.string().optional(),
  name: z.string(),
  timezone: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

const planCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  visibility: planVisibilitySchema.optional(),
  location: locationSchema.nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

const planPatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: planStatusSchema.optional(),
  visibility: planVisibilitySchema.optional(),
  location: locationSchema.nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

const participantCreateRoleSchema = z.enum(['participant', 'viewer']);

const participantCreateSchema = z.object({
  name: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  contactPhone: z.string().min(1).max(50),
  displayName: z.string().min(1).max(255).optional(),
  role: participantCreateRoleSchema.optional(),
  avatarUrl: z.string().optional(),
  contactEmail: z.string().max(255).optional(),
  adultsCount: z.number().int().min(0).optional(),
  kidsCount: z.number().int().min(0).optional(),
  foodPreferences: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

const participantPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  contactPhone: z.string().min(1).max(50).optional(),
  displayName: z.string().max(255).nullable().optional(),
  role: participantCreateRoleSchema.optional(),
  avatarUrl: z.string().nullable().optional(),
  contactEmail: z.string().max(255).nullable().optional(),
  adultsCount: z.number().int().min(0).nullable().optional(),
  kidsCount: z.number().int().min(0).nullable().optional(),
  foodPreferences: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ownerBodySchema = z.object({
  name: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  contactPhone: z.string().min(1).max(50),
  displayName: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().optional(),
  contactEmail: z.string().max(255).optional(),
});

const planCreateWithOwnerSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  visibility: planVisibilitySchema.optional(),
  location: locationSchema.nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  owner: ownerBodySchema,
  participants: z.array(participantCreateSchema).optional(),
});

const itemCreateSchema = z.object({
  name: z.string().min(1).max(255),
  category: itemCategorySchema,
  quantity: z.number().int().min(1),
  unit: unitSchema.optional(),
  status: itemStatusSchema,
  notes: z.string().nullable().optional(),
  assignedParticipantId: z.string().nullable().optional(),
});

const itemPatchSchema = itemCreateSchema.partial();

export interface BuildServerOptions {
  dataFilePath?: string;
  initialData?: MockData;
  persist?: boolean;
  logger?: boolean;
}

interface MutableStore {
  plans: Plan[];
  participants: Participant[];
  items: Item[];
}

function cloneData(data: MockData): MutableStore {
  const plans = structuredClone(data.plans).map((plan) => {
    const participantIds = plan.participantIds ? [...plan.participantIds] : [];
    if (
      plan.ownerParticipantId &&
      !participantIds.includes(plan.ownerParticipantId)
    ) {
      participantIds.push(plan.ownerParticipantId);
    }

    return {
      ...plan,
      participantIds,
    };
  });

  return {
    plans,
    participants: structuredClone(data.participants),
    items: structuredClone(data.items),
  };
}

function extractUserIdFromJwt(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function ensurePlan(store: MutableStore, planId: string): Plan {
  const plan = store.plans.find((entry) => entry.planId === planId);
  if (!plan) {
    throw new HttpError('Plan not found', 404);
  }
  return plan;
}

function ensureParticipant(
  store: MutableStore,
  participantId: string
): Participant {
  const participant = store.participants.find(
    (entry) => entry.participantId === participantId
  );
  if (!participant) {
    throw new HttpError('Participant not found', 404);
  }
  return participant;
}

function ensureItem(store: MutableStore, itemId: string): Item {
  const item = store.items.find((entry) => entry.itemId === itemId);
  if (!item) {
    throw new HttpError('Item not found', 404);
  }
  return item;
}

async function persistData(
  data: MutableStore,
  shouldPersist: boolean,
  filePath: string
): Promise<void> {
  if (!shouldPersist) {
    return;
  }

  await saveMockData(
    {
      plans: data.plans.map((plan) => ({
        ...plan,
        participantIds: plan.participantIds ?? undefined,
      })),
      participants: data.participants,
      items: data.items,
    },
    filePath
  );
}

export async function buildServer(
  options: BuildServerOptions = {}
): Promise<FastifyInstance> {
  const enableLogger = options.logger !== false;
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req, body, done) => {
      if (!body || (typeof body === 'string' && body.trim() === '')) {
        done(null, undefined);
        return;
      }
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  const filePath = options.dataFilePath ?? DEFAULT_MOCK_DATA_PATH;
  const initialData = options.initialData ?? (await loadMockData(filePath));
  const store = cloneData(initialData);
  const shouldPersist = options.persist ?? true;

  if (enableLogger) {
    app.addHook('onResponse', (request, reply, done) => {
      if (request.method === 'OPTIONS') {
        done();
        return;
      }

      const status = reply.statusCode;
      const ms = reply.elapsedTime.toFixed(0);
      const tag = statusColor(status);
      const reset = '\x1b[0m';

      const parts = [
        `${tag}${request.method}${reset}`,
        request.url,
        `→ ${tag}${status}${reset}`,
        `(${ms}ms)`,
      ];

      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
        parts.push(`\n  body: ${JSON.stringify(request.body)}`);
      }

      console.info(`[mock] ${parts.join(' ')}`);
      done();
    });
  }

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      if (enableLogger) {
        console.warn(
          `[mock] \x1b[31m${request.method}\x1b[0m ${request.url} → \x1b[31m${error.statusCode}\x1b[0m ${error.message}`
        );
      }
      void reply.status(error.statusCode).send({ message: error.message });
      return;
    }

    const status =
      'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500;
    if (enableLogger) {
      console.error(
        `[mock] \x1b[31m${request.method}\x1b[0m ${request.url} → \x1b[31m${status}\x1b[0m ${error.message}`,
        ['POST', 'PUT', 'PATCH'].includes(request.method) && request.body
          ? `\n  body: ${JSON.stringify(request.body)}`
          : ''
      );
    }
    void reply
      .status(status)
      .send({ message: error.message ?? 'Unexpected error' });
  });

  app.get('/health', async (_request, reply) => {
    void reply.send({ status: 'healthy', database: 'connected' });
  });

  app.get('/plans', async (_request, reply) => {
    void reply.send(store.plans);
  });

  app.post('/plans', async (request, reply) => {
    const parsed = planCreateSchema.parse(request.body);
    const now = new Date().toISOString();
    const location = parsed.location
      ? {
          ...parsed.location,
          locationId: parsed.location.locationId ?? randomUUID(),
        }
      : undefined;
    const plan: Plan = {
      planId: randomUUID(),
      createdAt: now,
      updatedAt: now,
      description: parsed.description,
      endDate: parsed.endDate,
      location,
      ownerParticipantId: undefined,
      participantIds: [],
      startDate: parsed.startDate,
      status: 'draft',
      tags: parsed.tags,
      title: parsed.title,
      visibility: parsed.visibility ?? 'private',
    };

    store.plans.push(plan);
    await persistData(store, shouldPersist, filePath);

    void reply.status(201).send(plan);
  });

  app.post('/plans/with-owner', async (request, reply) => {
    const parsed = planCreateWithOwnerSchema.parse(request.body);
    const now = new Date().toISOString();
    const planId = randomUUID();
    const jwtUserId = extractUserIdFromJwt(
      request.headers.authorization as string | undefined
    );

    const location = parsed.location
      ? {
          ...parsed.location,
          locationId: parsed.location.locationId ?? randomUUID(),
        }
      : undefined;

    const ownerParticipantId = randomUUID();
    const ownerParticipant: Participant = {
      participantId: ownerParticipantId,
      planId,
      userId: jwtUserId ?? undefined,
      name: parsed.owner.name,
      lastName: parsed.owner.lastName,
      contactPhone: parsed.owner.contactPhone,
      displayName: parsed.owner.displayName ?? null,
      role: 'owner',
      avatarUrl: parsed.owner.avatarUrl ?? null,
      contactEmail: parsed.owner.contactEmail ?? null,
      inviteToken: randomBytes(32).toString('hex'),
      inviteStatus: 'accepted' as const,
      rsvpStatus: 'confirmed',
      lastActivityAt: null,
      adultsCount: null,
      kidsCount: null,
      foodPreferences: null,
      allergies: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    };

    const additionalParticipants: Participant[] = (
      parsed.participants ?? []
    ).map((p) => ({
      participantId: randomUUID(),
      planId,
      name: p.name,
      lastName: p.lastName,
      contactPhone: p.contactPhone,
      displayName: p.displayName ?? null,
      role: p.role ?? 'participant',
      avatarUrl: p.avatarUrl ?? null,
      contactEmail: p.contactEmail ?? null,
      inviteToken: randomBytes(32).toString('hex'),
      inviteStatus: 'invited' as const,
      rsvpStatus: 'pending' as const,
      lastActivityAt: null,
      adultsCount: p.adultsCount ?? null,
      kidsCount: p.kidsCount ?? null,
      foodPreferences: p.foodPreferences ?? null,
      allergies: p.allergies ?? null,
      notes: p.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }));

    const allParticipants = [ownerParticipant, ...additionalParticipants];

    const plan: Plan = {
      planId,
      createdAt: now,
      updatedAt: now,
      description: parsed.description,
      endDate: parsed.endDate,
      location,
      ownerParticipantId,
      participantIds: allParticipants.map((p) => p.participantId),
      startDate: parsed.startDate,
      status: 'draft',
      tags: parsed.tags,
      title: parsed.title,
      visibility: parsed.visibility ?? 'private',
    };

    store.plans.push(plan);
    store.participants.push(...allParticipants);
    await persistData(store, shouldPersist, filePath);

    void reply.status(201).send({
      ...plan,
      items: [],
      participants: allParticipants,
    });
  });

  app.get<{ Params: { planId: string } }>(
    '/plans/:planId',
    async (request, reply) => {
      const plan = ensurePlan(store, request.params.planId);
      const planItems = store.items.filter(
        (item) => item.planId === plan.planId
      );
      const participantIds = new Set(plan.participantIds ?? []);
      const planParticipants = store.participants.filter((p) =>
        participantIds.has(p.participantId)
      );

      const jwtUserId = extractUserIdFromJwt(
        request.headers.authorization as string | undefined
      );
      if (jwtUserId) {
        const ownerP = planParticipants.find((p) => p.role === 'owner');
        if (ownerP && !ownerP.userId) {
          ownerP.userId = jwtUserId;
        }
      }

      void reply.send({
        ...plan,
        items: planItems,
        participants: planParticipants,
      });
    }
  );

  app.patch<{ Params: { planId: string } }>(
    '/plans/:planId',
    async (request, reply) => {
      const plan = ensurePlan(store, request.params.planId);
      const updates = planPatchSchema.parse(request.body ?? {});
      const now = new Date().toISOString();

      Object.assign(plan, updates, { updatedAt: now });

      if (updates.location) {
        plan.location = {
          ...updates.location,
          locationId:
            updates.location.locationId ??
            plan.location?.locationId ??
            randomUUID(),
        };
      }

      await persistData(store, shouldPersist, filePath);

      void reply.send(plan);
    }
  );

  app.delete<{ Params: { planId: string } }>(
    '/plans/:planId',
    async (request, reply) => {
      const index = store.plans.findIndex(
        (entry) => entry.planId === request.params.planId
      );
      if (index === -1) {
        throw new HttpError('Plan not found', 404);
      }

      store.plans.splice(index, 1);
      store.items = store.items.filter(
        (item) => item.planId !== request.params.planId
      );

      await persistData(store, shouldPersist, filePath);

      void reply.send({ ok: true });
    }
  );

  app.get<{ Params: { planId: string; inviteToken: string } }>(
    '/plans/:planId/invite/:inviteToken',
    async (request, reply) => {
      const { planId, inviteToken } = request.params;
      const plan = store.plans.find((p) => p.planId === planId);
      if (!plan) {
        throw new HttpError('Plan not found', 404);
      }

      const participantIds = new Set(plan.participantIds ?? []);
      const planParticipants = store.participants.filter((p) =>
        participantIds.has(p.participantId)
      );

      const tokenMatch = planParticipants.find(
        (p) => p.inviteToken === inviteToken
      );
      if (!tokenMatch) {
        throw new HttpError('Invalid or expired invite link', 404);
      }

      const planItems = store.items.filter((item) => item.planId === planId);
      const strippedParticipants = planParticipants.map((p) => ({
        participantId: p.participantId,
        displayName: p.displayName ?? `${p.name} ${p.lastName}`,
        role: p.role,
      }));

      void reply.send({
        planId: plan.planId,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        location: plan.location ?? null,
        startDate: plan.startDate,
        endDate: plan.endDate,
        tags: plan.tags,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        items: planItems,
        participants: strippedParticipants,
      });
    }
  );

  app.post<{ Params: { planId: string; inviteToken: string } }>(
    '/plans/:planId/claim/:inviteToken',
    async (request, reply) => {
      const { planId, inviteToken } = request.params;
      const plan = store.plans.find((p) => p.planId === planId);
      if (!plan) {
        throw new HttpError('Plan not found', 404);
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new HttpError('Unauthorized', 401);
      }

      let userId = 'mock-user-id';
      try {
        const payload = JSON.parse(atob(authHeader.split('.')[1]));
        userId = payload.sub ?? userId;
      } catch {
        /* use default */
      }

      const participantIds = new Set(plan.participantIds ?? []);
      const planParticipants = store.participants.filter((p) =>
        participantIds.has(p.participantId)
      );

      const tokenMatch = planParticipants.find(
        (p) => p.inviteToken === inviteToken
      );
      if (!tokenMatch) {
        throw new HttpError('Invalid or expired invite link', 404);
      }

      if (tokenMatch.inviteStatus === 'accepted') {
        throw new HttpError('Invite already claimed', 400);
      }

      tokenMatch.userId = userId;
      tokenMatch.inviteStatus = 'accepted';
      tokenMatch.updatedAt = new Date().toISOString();

      await persistData(store, shouldPersist, filePath);

      void reply.send(tokenMatch);
    }
  );

  app.get<{ Params: { planId: string } }>(
    '/plans/:planId/participants',
    async (request, reply) => {
      const plan = ensurePlan(store, request.params.planId);
      const participantIds = new Set(plan.participantIds ?? []);
      const participants = store.participants.filter((participant) =>
        participantIds.has(participant.participantId)
      );

      void reply.send(participants);
    }
  );

  app.post<{ Params: { planId: string } }>(
    '/plans/:planId/participants',
    async (request, reply) => {
      const plan = ensurePlan(store, request.params.planId);
      const parsed = participantCreateSchema.parse(request.body);
      const now = new Date().toISOString();
      const participant: Participant = {
        participantId: randomUUID(),
        planId: plan.planId,
        name: parsed.name,
        lastName: parsed.lastName,
        contactPhone: parsed.contactPhone,
        displayName: parsed.displayName ?? null,
        role: parsed.role ?? 'participant',
        avatarUrl: parsed.avatarUrl ?? null,
        contactEmail: parsed.contactEmail ?? null,
        inviteToken: randomBytes(32).toString('hex'),
        inviteStatus: 'invited',
        rsvpStatus: 'pending',
        lastActivityAt: null,
        adultsCount: parsed.adultsCount ?? null,
        kidsCount: parsed.kidsCount ?? null,
        foodPreferences: parsed.foodPreferences ?? null,
        allergies: parsed.allergies ?? null,
        notes: parsed.notes ?? null,
        createdAt: now,
        updatedAt: now,
      };

      store.participants.push(participant);

      plan.participantIds = plan.participantIds ?? [];
      plan.participantIds.push(participant.participantId);

      await persistData(store, shouldPersist, filePath);

      void reply.status(201).send(participant);
    }
  );

  app.get<{ Params: { participantId: string } }>(
    '/participants/:participantId',
    async (request, reply) => {
      const participant = ensureParticipant(
        store,
        request.params.participantId
      );
      void reply.send(participant);
    }
  );

  app.patch<{ Params: { participantId: string } }>(
    '/participants/:participantId',
    async (request, reply) => {
      const participant = ensureParticipant(
        store,
        request.params.participantId
      );
      const updates = participantPatchSchema.parse(request.body ?? {});
      const now = new Date().toISOString();

      const nextRole = updates.role ?? participant.role;

      Object.assign(participant, updates, {
        updatedAt: now,
        isOwner: nextRole === 'owner',
      });

      store.plans.forEach((plan) => {
        if (
          plan.participantIds?.includes(participant.participantId) &&
          participant.isOwner
        ) {
          plan.ownerParticipantId = participant.participantId;
        }
      });

      await persistData(store, shouldPersist, filePath);

      void reply.send(participant);
    }
  );

  app.delete<{ Params: { participantId: string } }>(
    '/participants/:participantId',
    async (request, reply) => {
      const index = store.participants.findIndex(
        (participant) =>
          participant.participantId === request.params.participantId
      );

      if (index === -1) {
        throw new HttpError('Participant not found', 404);
      }

      const [removed] = store.participants.splice(index, 1);

      store.plans.forEach((plan) => {
        if (plan.ownerParticipantId === removed.participantId) {
          plan.ownerParticipantId = '';
        }
        if (plan.participantIds) {
          plan.participantIds = plan.participantIds.filter(
            (participantId) => participantId !== removed.participantId
          );
        }
      });

      await persistData(store, shouldPersist, filePath);

      void reply.status(204).send();
    }
  );

  app.get<{ Params: { planId: string } }>(
    '/plans/:planId/items',
    async (request, reply) => {
      ensurePlan(store, request.params.planId);
      const planItems = store.items.filter(
        (item) => item.planId === request.params.planId
      );
      void reply.send(planItems);
    }
  );

  app.post<{ Params: { planId: string } }>(
    '/plans/:planId/items',
    async (request, reply) => {
      ensurePlan(store, request.params.planId);
      const parsed = itemCreateSchema.parse(request.body);
      const now = new Date().toISOString();
      const item: Item = {
        itemId: randomUUID(),
        planId: request.params.planId,
        name: parsed.name,
        category: parsed.category,
        quantity: parsed.quantity,
        unit: parsed.unit ?? 'pcs',
        status: parsed.status,
        notes: parsed.notes,
        assignedParticipantId: parsed.assignedParticipantId,
        createdAt: now,
        updatedAt: now,
      };

      store.items.push(item);

      await persistData(store, shouldPersist, filePath);

      void reply.status(201).send(item);
    }
  );

  app.get<{ Params: { itemId: string } }>(
    '/items/:itemId',
    async (request, reply) => {
      const item = ensureItem(store, request.params.itemId);
      void reply.send(item);
    }
  );

  app.patch<{ Params: { itemId: string } }>(
    '/items/:itemId',
    async (request, reply) => {
      const item = ensureItem(store, request.params.itemId);
      const updates = itemPatchSchema.parse(request.body ?? {});
      const now = new Date().toISOString();

      Object.assign(item, updates, { updatedAt: now });

      await persistData(store, shouldPersist, filePath);

      void reply.send(item);
    }
  );

  app.get('/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      void reply.status(401).send({ message: 'Unauthorized' });
      return;
    }

    const token = authHeader.slice(7);
    let email = 'test@chillist.dev';
    let sub = '00000000-0000-0000-0000-000000000001';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.email) email = payload.email;
      if (payload.sub) sub = payload.sub;
    } catch {
      // malformed token — fall back to defaults
    }

    void reply.send({
      user: { id: sub, email, role: 'authenticated' },
    });
  });

  app.post('/_reset', async (_request, reply) => {
    const fresh = cloneData(initialData);
    store.plans = fresh.plans;
    store.participants = fresh.participants;
    store.items = fresh.items;
    void reply.send({ ok: true });
  });

  return app;
}

async function start(): Promise<void> {
  const persist = process.env.MOCK_PERSIST !== 'false';
  const server = await buildServer({ persist });
  const port = Number(process.env.MOCK_SERVER_PORT ?? 3333);
  const host = process.env.MOCK_SERVER_HOST ?? '0.0.0.0';

  await server.listen({ port, host });

  console.info(
    `[mock] server listening on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`
  );
}

const isPrimaryModule =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isPrimaryModule) {
  start().catch((error) => {
    console.error('[mock] failed to start server', error);
    process.exitCode = 1;
  });
}
