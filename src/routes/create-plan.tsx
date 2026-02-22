import { useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import PlanForm from '../components/PlanForm';
import { useCreatePlan } from '../hooks/useCreatePlan';
import { useAuth } from '../contexts/useAuth';
import type { PlanFormPayload, DefaultOwner } from '../components/PlanForm';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
});

function splitFullName(fullName?: string): { first: string; last: string } {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' '),
  };
}

export function CreatePlan() {
  const navigate = useNavigate();
  const createPlan = useCreatePlan();
  const { user, loading } = useAuth();

  const defaultOwner = useMemo((): DefaultOwner | undefined => {
    if (!user) return undefined;
    const meta = user.user_metadata ?? {};
    const { first, last } = splitFullName(meta.full_name as string);
    return {
      ownerName: (meta.first_name as string) || first,
      ownerLastName: (meta.last_name as string) || last,
      ownerPhone: (meta.phone as string) || '',
      ownerEmail: user.email ?? '',
    };
  }, [user]);

  async function handleSubmit(payload: PlanFormPayload) {
    const created = await createPlan.mutateAsync(payload);
    if (created?.planId) {
      navigate({ to: '/plan/$planId', params: { planId: created.planId } });
    } else {
      navigate({ to: '/plans' });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <PlanForm
      onSubmit={handleSubmit}
      isSubmitting={createPlan.isPending}
      defaultOwner={defaultOwner}
    />
  );
}
