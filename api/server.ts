import { randomUUID } from 'node:crypto';
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

const planStatusSchema = z.enum(['draft', 'active', 'archived']);
const planVisibilitySchema = z.enum(['public', 'unlisted', 'private']);
const participantRoleSchema = z.enum(['owner', 'participant', 'viewer']);
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
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: planStatusSchema.default('draft'),
  visibility: planVisibilitySchema.default('private'),
  ownerParticipantId: z.string().nullable().optional(),
  location: locationSchema.nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  participantIds: z.array(z.string()).optional(),
});

const planPatchSchema = planCreateSchema.partial();

const participantCreateSchema = z.object({
  displayName: z.string().min(1),
  role: participantRoleSchema,
  name: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

const participantPatchSchema = participantCreateSchema.partial();

const itemCreateSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: unitSchema.optional(),
  status: itemStatusSchema.optional(),
  notes: z.string().optional(),
  category: itemCategorySchema,
});

const itemPatchSchema = itemCreateSchema.partial();

export interface BuildServerOptions {
  dataFilePath?: string;
  initialData?: MockData;
  persist?: boolean;
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
      plans: data.plans,
      participants: data.participants,
      items: data.items,
    },
    filePath
  );
}

export async function buildServer(
  options: BuildServerOptions = {}
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true,
  });

  const filePath = options.dataFilePath ?? DEFAULT_MOCK_DATA_PATH;
  const initialData = options.initialData ?? (await loadMockData(filePath));
  const store = cloneData(initialData);
  const shouldPersist = options.persist ?? true;

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      void reply.status(error.statusCode).send({ message: error.message });
      return;
    }

    const status =
      'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500;
    void reply
      .status(status)
      .send({ message: error.message ?? 'Unexpected error' });
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
    const participantIds = parsed.participantIds
      ? [...new Set(parsed.participantIds)]
      : [];
    if (!participantIds.includes(parsed.ownerParticipantId)) {
      participantIds.push(parsed.ownerParticipantId);
    }
    const plan: Plan = {
      planId: randomUUID(),
      createdAt: now,
      updatedAt: now,
      description: parsed.description,
      endDate: parsed.endDate,
      location,
      ownerParticipantId: parsed.ownerParticipantId,
      participantIds,
      startDate: parsed.startDate,
      status: parsed.status,
      tags: parsed.tags,
      title: parsed.title,
      visibility: parsed.visibility,
    };

    store.plans.push(plan);
    await persistData(store, shouldPersist, filePath);

    void reply.status(201).send(plan);
  });

  app.get<{ Params: { planId: string } }>(
    '/plans/:planId',
    async (request, reply) => {
      const plan = ensurePlan(store, request.params.planId);
      const planItems = store.items.filter(
        (item) => item.planId === plan.planId
      );
      void reply.send({ ...plan, items: planItems });
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

      if (updates.participantIds) {
        plan.participantIds = [...new Set(updates.participantIds)];
      }

      if (updates.ownerParticipantId) {
        plan.participantIds = plan.participantIds ?? [];
        if (!plan.participantIds.includes(updates.ownerParticipantId)) {
          plan.participantIds.push(updates.ownerParticipantId);
        }
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

      void reply.status(204).send();
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
        displayName: parsed.displayName,
        role: parsed.role,
        name: parsed.name ?? parsed.displayName,
        lastName: parsed.lastName ?? parsed.displayName,
        isOwner: parsed.role === 'owner',
        avatarUrl: parsed.avatarUrl,
        contactEmail: parsed.contactEmail,
        contactPhone: parsed.contactPhone,
        createdAt: now,
        updatedAt: now,
      };

      store.participants.push(participant);
      if (participant.isOwner) {
        plan.ownerParticipantId = participant.participantId;
      }

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
        quantity: parsed.quantity ?? 1,
        unit: parsed.unit ?? 'pcs',
        status: parsed.status ?? 'pending',
        notes: parsed.notes,
        category: parsed.category,
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

  app.delete<{ Params: { itemId: string } }>(
    '/items/:itemId',
    async (request, reply) => {
      const index = store.items.findIndex(
        (entry) => entry.itemId === request.params.itemId
      );
      if (index === -1) {
        throw new HttpError('Item not found', 404);
      }

      store.items.splice(index, 1);

      await persistData(store, shouldPersist, filePath);

      void reply.status(204).send();
    }
  );

  return app;
}

async function start(): Promise<void> {
  const server = await buildServer();
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
