import { useTranslation } from 'react-i18next';
import type { PendingRequestPlan } from '../core/schemas/plan';

interface PendingRequestsListProps {
  plans: PendingRequestPlan[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PendingRequestsList({ plans }: PendingRequestsListProps) {
  const { t } = useTranslation();

  if (plans.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t('plans.pendingRequestsTitle')}
      </h2>
      <ul
        data-testid="pending-requests-list"
        className="bg-white rounded-lg shadow-sm divide-y divide-gray-200 overflow-hidden"
      >
        {plans.map((plan) => {
          const meta: string[] = [];
          if (plan.startDate) {
            meta.push(formatDate(plan.startDate));
          }
          if (plan.endDate && plan.endDate !== plan.startDate) {
            meta.push(formatDate(plan.endDate));
          }
          const locationName = (
            plan.location as { name?: string | null } | null
          )?.name;
          if (locationName) {
            meta.push(locationName);
          }

          return (
            <li
              key={plan.planId}
              data-testid={`pending-request-plan-${plan.planId}`}
              className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <span className="text-base sm:text-lg font-medium text-gray-700">
                  {plan.title}
                </span>
                <span className="inline-flex self-start sm:self-auto items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                  {t('plans.pendingForApproval')}
                </span>
              </div>
              {meta.length > 0 && (
                <p className="mt-1 text-sm text-gray-400">
                  {meta.join('  ·  ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
