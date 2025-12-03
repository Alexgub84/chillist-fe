import { createLazyFileRoute } from '@tanstack/react-router';
import { usePlans } from '../hooks/usePlans';
import { PlansList } from '../components/PlansList';

export const Route = createLazyFileRoute('/plans')({
  component: Plans,
});

function Plans() {
  const { data: plans, isLoading, error } = usePlans();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error loading plans: {error.message}</div>
      </div>
    );
  }

  return <PlansList plans={plans ?? []} />;
}
