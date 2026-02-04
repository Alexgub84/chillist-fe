import type { Plan } from '../core/types/plan';
import { Link } from '@tanstack/react-router';

interface PlansListProps {
  plans: Array<Pick<Plan, 'planId' | 'title'>>;
}

export function PlansList({ plans }: PlansListProps) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          My Plans
        </h1>
        <button
          type="button"
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer shadow-sm hover:shadow-md"
        >
          <Link to="/create-plan" className="block">
            Create New Plan
          </Link>
        </button>
      </div>
      {plans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <p className="text-gray-500 text-base sm:text-lg">
            No plans yet. Create one to get started!
          </p>
        </div>
      ) : (
        <ul
          data-testid="plans-list"
          className="bg-white rounded-lg shadow-sm divide-y divide-gray-200 overflow-hidden"
        >
          {plans.map((plan) => (
            <li
              key={plan.planId}
              className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
            >
              <Link
                to="/plan/$planId"
                params={{ planId: plan.planId }}
                className="block group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {plan.title}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 font-mono break-all">
                    {plan.planId}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
