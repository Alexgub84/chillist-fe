import { createFileRoute, redirect } from '@tanstack/react-router';
import CreatePlanWizard from '../components/CreatePlanWizard';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/signin' });
    }
  },
});

export function CreatePlan() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <CreatePlanWizard user={user} />;
}
