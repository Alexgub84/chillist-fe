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
  name: z.string().optional(),
  timezone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

const planSchema = z.object({
  planId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  ownerParticipantId: z.string(),
  location: locationSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  participantIds: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const participantSchema = z.object({
  participantId: z.string(),
  name: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  role: z.enum(['owner', 'participant', 'viewer']),
  isOwner: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const equipmentItemSchema = z.object({
  itemId: z.string(),
  planId: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.enum(['pcs', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'pack', 'set']),
  notes: z.string().optional(),
  status: z.enum(['pending', 'purchased', 'packed', 'canceled']),
  createdAt: z.string(),
  updatedAt: z.string(),
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
