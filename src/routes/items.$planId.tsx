import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/items/$planId')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  beforeLoad: async ({ params, search }) => {
    if (search.token) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/signin',
        search: { redirect: `/items/${params.planId}` },
      });
    }
  },
});
