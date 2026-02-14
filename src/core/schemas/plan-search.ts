import { z } from 'zod';
import { itemStatusSchema } from './item';

export const planSearchSchema = z.object({
  status: itemStatusSchema.optional().catch(undefined),
});
