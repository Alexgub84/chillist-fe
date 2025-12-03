import { z } from 'zod';

export const locationSchema = z.object({
  locationId: z.string().optional(),
  name: z.string().optional(),
  timezone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;
