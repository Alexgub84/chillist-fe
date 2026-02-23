import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { Plan, PlanStatus } from '../core/types/plan';

type TimeFilter = 'all' | 'upcoming' | 'past';

interface PlansListProps {
  plans: Array<
    Pick<
      Plan,
      | 'planId'
      | 'title'
      | 'status'
      | 'startDate'
      | 'endDate'
      | 'location'
      | 'participantIds'
    >
  >;
}

const statusClassName: Record<PlanStatus, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

const TIME_FILTERS: { value: TimeFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'plans.all' },
  { value: 'upcoming', labelKey: 'plans.upcoming' },
  { value: 'past', labelKey: 'plans.past' },
];

function isPastPlan(plan: {
  startDate?: string | null;
  endDate?: string | null;
}): boolean {
  const dateStr = plan.endDate ?? plan.startDate;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function PlansList({ plans }: PlansListProps) {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');

  const filteredPlans = useMemo(() => {
    if (timeFilter === 'all') return plans;
    if (timeFilter === 'past') return plans.filter(isPastPlan);
    return plans.filter((p) => !isPastPlan(p));
  }, [plans, timeFilter]);

  const counts = useMemo(() => {
    const past = plans.filter(isPastPlan).length;
    return { all: plans.length, upcoming: plans.length - past, past };
  }, [plans]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getEmptyMessage(): string {
    if (plans.length === 0) return t('plans.empty');
    if (timeFilter === 'upcoming') return t('plans.emptyUpcoming');
    if (timeFilter === 'past') return t('plans.emptyPast');
    return t('plans.empty');
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          {t('plans.title')}
        </h1>
        <button
          type="button"
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer shadow-sm hover:shadow-md"
        >
          <Link to="/create-plan" className="block">
            {t('plans.createNew')}
          </Link>
        </button>
      </div>

      {plans.length > 0 && (
        <div
          className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1 mb-4"
          role="tablist"
          aria-label={t('plans.title')}
        >
          {TIME_FILTERS.map((tab) => {
            const isActive = timeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                data-testid={`time-filter-${tab.value}`}
                onClick={() => setTimeFilter(tab.value)}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-gray-800 text-white shadow-sm border border-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent'
                )}
                aria-selected={isActive}
              >
                <span>{t(tab.labelKey)}</span>
                <span
                  className={clsx(
                    'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums',
                    isActive
                      ? 'bg-white/30 backdrop-blur-sm'
                      : 'bg-gray-200/70 text-gray-500'
                  )}
                >
                  {counts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
          <p className="text-gray-500 text-base sm:text-lg">
            {getEmptyMessage()}
          </p>
        </div>
      ) : (
        <ul
          data-testid="plans-list"
          className="bg-white rounded-lg shadow-sm divide-y divide-gray-200 overflow-hidden"
        >
          {filteredPlans.map((plan) => {
            const meta: string[] = [];
            if (plan.startDate) {
              meta.push(formatDate(plan.startDate));
            }
            if (plan.location?.name) {
              meta.push(plan.location.name);
            }
            if (plan.participantIds && plan.participantIds.length > 0) {
              meta.push(
                t('plans.participant', { count: plan.participantIds.length })
              );
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
                        statusClassName[plan.status]
                      )}
                    >
                      {t(`planStatus.${plan.status}`)}
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
