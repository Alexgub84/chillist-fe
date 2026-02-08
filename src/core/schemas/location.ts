import { z } from 'zod';

export const locationSchema = z.object({
  locationId: z.string(),
  name: z.string(),
  timezone: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  country: z.string().nullish(),
  region: z.string().nullish(),
  city: z.string().nullish(),
});

export type Location = z.infer<typeof locationSchema>;
