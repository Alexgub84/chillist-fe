import clsx from 'clsx';
import { Link } from '@tanstack/react-router';
import type { Plan, PlanStatus } from '../core/types/plan';

interface PlansListProps {
  plans: Array<
    Pick<
      Plan,
      | 'planId'
      | 'title'
      | 'status'
      | 'startDate'
      | 'location'
      | 'participantIds'
    >
  >;
}

const statusConfig: Record<PlanStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700',
  },
  draft: {
    label: 'Draft',
    className: 'bg-yellow-100 text-yellow-700',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500',
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
          {plans.map((plan) => {
            const { label, className } = statusConfig[plan.status];
            const meta: string[] = [];
            if (plan.startDate) {
              meta.push(formatDate(plan.startDate));
            }
            if (plan.location?.name) {
              meta.push(plan.location.name);
            }
            if (plan.participantIds && plan.participantIds.length > 0) {
              const count = plan.participantIds.length;
              meta.push(`${count} participant${count === 1 ? '' : 's'}`);
            }

            return (
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
                    <span
                      className={clsx(
                        'inline-flex self-start sm:self-auto items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        className
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {meta.length > 0 && (
                    <p className="mt-1 text-sm text-gray-400">
                      {meta.join('  ·  ')}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
