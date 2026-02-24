import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);
const defaultDataFilePath = resolve(currentDir, 'mock-data.json');

export const DEFAULT_MOCK_DATA_PATH = defaultDataFilePath;

const locationSchema = z.object({
  locationId: z.string(),
  name: z.string(),
  timezone: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

const planSchema = z.object({
  planId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  visibility: z.enum(['public', 'invite_only', 'private']),
  ownerParticipantId: z.string().nullable().optional(),
  location: locationSchema.nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  participantIds: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const participantSchema = z
  .object({
    participantId: z.string(),
    planId: z.string(),
    name: z.string(),
    lastName: z.string(),
    contactPhone: z.string(),
    displayName: z.string().nullable().optional(),
    role: z.enum(['owner', 'participant', 'viewer']),
    avatarUrl: z.string().url().nullish(),
    contactEmail: z.string().email().nullish(),
    inviteToken: z.string().nullish(),
    rsvpStatus: z
      .enum(['pending', 'confirmed', 'not_sure'])
      .optional()
      .default('pending'),
    lastActivityAt: z.string().datetime().nullish(),
    adultsCount: z.number().int().nullish(),
    kidsCount: z.number().int().nullish(),
    foodPreferences: z.string().nullish(),
    allergies: z.string().nullish(),
    notes: z.string().nullish(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .passthrough();

const equipmentItemSchema = z.object({
  itemId: z.string(),
  planId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unit: z.enum(['pcs', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'pack', 'set']),
  notes: z.string().nullish(),
  status: z.enum(['pending', 'purchased', 'packed', 'canceled']),
  assignedParticipantId: z.string().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  category: z.literal('equipment'),
});

const foodItemSchema = equipmentItemSchema.extend({
  category: z.literal('food'),
});

const itemSchema = z.discriminatedUnion('category', [
  equipmentItemSchema,
  foodItemSchema,
]);

const mockDataSchema = z.object({
  plans: z.array(planSchema),
  participants: z.array(participantSchema),
  items: z.array(itemSchema),
});

export type MockData = z.infer<typeof mockDataSchema>;

export async function loadMockData(
  filePath: string = defaultDataFilePath
): Promise<MockData> {
  const fileContents = await readFile(filePath, 'utf-8');
  const data = JSON.parse(fileContents) as unknown;
  return mockDataSchema.parse(data);
}

export async function saveMockData(
  data: MockData,
  filePath: string = defaultDataFilePath
): Promise<void> {
  const serialized = JSON.stringify(data, null, 2);
  await writeFile(filePath, `${serialized}\n`, 'utf-8');
}

export function logSummary(data: MockData): void {
  const summary = {
    plans: data.plans.length,
    participants: data.participants.length,
    items: data.items.length,
  };

  console.info('[mock] dataset loaded', summary);
}

async function main(): Promise<void> {
  const data = await loadMockData();
  logSummary(data);
}

const isPrimaryModule =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isPrimaryModule) {
  main().catch((error) => {
    console.error('[mock] failed to load dataset', error);
    process.exitCode = 1;
  });
}
