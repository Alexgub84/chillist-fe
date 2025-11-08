import { createLazyFileRoute } from '@tanstack/react-router';
import { Link, useParams } from '@tanstack/react-router';
import { usePlan } from '../hooks/usePlan';

export const Route = createLazyFileRoute('/plans/$planId')({
  component: PlanDetails,
});

function PlanDetails() {
  const { planId } = useParams('/plans/$planId');
  const { data: plan, isLoading, error } = usePlan(planId);

  if (isLoading) {
    return <div className="text-center">Loading plan details...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading plan: {error.message}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Plan not found</div>
        <Link
          to="/plans"
          className="text-blue-500 hover:underline block text-center mt-4"
        >
          Back to Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/plans" className="text-blue-500 hover:underline">
          ← Back to Plans
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{plan.title}</h1>
        {/* Add more plan details here as needed */}
      </div>
    </div>
  );
}
