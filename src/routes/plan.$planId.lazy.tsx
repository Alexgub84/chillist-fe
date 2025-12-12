import { createLazyFileRoute } from '@tanstack/react-router';
import { Link, useParams } from '@tanstack/react-router';
import { usePlan } from '../hooks/usePlan';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';

export const Route = createLazyFileRoute('/plan/$planId')({
  component: PlanDetails,
  errorComponent: ErrorPage,
});

function PlanDetails() {
  const { planId } = useParams({ from: '/plan/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);

  if (isLoading) {
    return <div className="text-center">Loading plan details...</div>;
  }

  if (error) {
    throw error;
  }

  if (!plan) {
    throw new Error('Plan not found');
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/plans" className="text-blue-500 hover:underline">
          ← Back to Plans
        </Link>
      </div>
      <Plan plan={plan} />
    </div>
  );
}
