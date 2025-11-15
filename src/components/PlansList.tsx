import type { Plan } from '../core/types/plan';
import { Link } from '@tanstack/react-router';

interface PlansListProps {
  plans: Array<Pick<Plan, 'planId' | 'title'>>;
}

export function PlansList({ plans }: PlansListProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Plans</h1>
      <ul
        data-testid="plans-list"
        className="bg-white rounded-lg shadow-md divide-y divide-gray-200"
      >
        {plans.map((plan) => (
          <li
            key={plan.planId}
            className="px-6 py-4 hover:bg-gray-50 transition"
          >
            <Link
              to="/plan/$planId"
              params={{ planId: plan.planId }}
              className="block text-lg text-gray-700 hover:text-blue-600 transition-colors"
            >
              {plan.title}
              <span className="text-gray-400 text-sm ml-2">{plan.planId}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
