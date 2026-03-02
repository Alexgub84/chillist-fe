import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/manage-participants/$planId')({
  beforeLoad: async ({ params }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/signin',
        search: { redirect: `/manage-participants/${params.planId}` },
      });
    }
  },
});
