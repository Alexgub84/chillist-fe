import { createFileRoute, useNavigate } from '@tanstack/react-router';
import PlanForm from '../components/PlanForm';
import { useCreatePlan } from '../hooks/useCreatePlan';
import type { PlanFormPayload } from '../components/PlanForm';

export const Route = createFileRoute('/create-plan')({
  component: CreatePlan,
});

export function CreatePlan() {
  const navigate = useNavigate();
  const createPlan = useCreatePlan();

  async function handleSubmit(payload: PlanFormPayload) {
    const created = await createPlan.mutateAsync(payload);
    if (created?.planId) {
      navigate({ to: '/plan/$planId', params: { planId: created.planId } });
    } else {
      navigate({ to: '/plans' });
    }
  }

  return (
    <PlanForm onSubmit={handleSubmit} isSubmitting={createPlan.isPending} />
  );
}
