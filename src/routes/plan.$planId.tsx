import { createFileRoute, redirect } from '@tanstack/react-router';
import { planSearchSchema } from '../core/schemas/plan-search';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/plan/$planId')({
  validateSearch: planSearchSchema,
  beforeLoad: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/signin',
        search: { redirect: `/plan/${params.planId}` },
      });
    }
  },
});
