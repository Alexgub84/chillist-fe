import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/admin/last-updated')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/signin' });
    }
    const role = (
      session.user.app_metadata as Record<string, unknown> | undefined
    )?.role;
    if (role !== 'admin') {
      throw redirect({ to: '/plans' });
    }
  },
});
