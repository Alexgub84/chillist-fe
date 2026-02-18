import { z } from 'zod';

const authMeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
  }),
});

export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;

export { authMeResponseSchema };
