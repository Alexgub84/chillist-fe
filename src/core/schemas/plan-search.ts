import { z } from 'zod';

export const listFilterSchema = z.enum(['buying', 'packing']);
export type ListFilter = z.infer<typeof listFilterSchema>;

export const planSearchSchema = z.object({
  list: listFilterSchema.optional().catch(undefined),
  participant: z.string().optional().catch(undefined),
});
