import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link } from '@tanstack/react-router';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Plan, PlanStatus } from '../core/types/plan';
import { useAuth } from '../contexts/useAuth';
import { useDeletePlan } from '../hooks/useDeletePlan';
import { getApiErrorMessage } from '../core/error-utils';
import Modal from './shared/Modal';

type TimeFilter = 'all' | 'upcoming' | 'past';
type MembershipFilter = 'all' | 'owned' | 'invited';

interface PlansListProps {
  plans: Plan[];
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

const MEMBERSHIP_FILTERS: { value: MembershipFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'plans.all' },
  { value: 'owned', labelKey: 'plans.filterOwned' },
  { value: 'invited', labelKey: 'plans.filterInvited' },
];

function isPlanOwnedBy(plan: Plan, userId: string): boolean {
  if (plan.createdByUserId === userId) return true;
  const owner = plan.participants?.find((p) => p.role === 'owner');
  return !!owner?.userId && owner.userId === userId;
}

function isPlanInvitedTo(plan: Plan, userId: string): boolean {
  const match = plan.participants?.find(
    (p) => p.userId === userId && p.role !== 'owner'
  );
  return !!match;
}

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
  const { user, isAdmin } = useAuth();
  const deletePlanMutation = useDeletePlan();
  const [membershipFilter, setMembershipFilter] =
    useState<MembershipFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const deletingPlan = deletingPlanId
    ? plans.find((p) => p.planId === deletingPlanId)
    : null;

  const membershipFilteredPlans = useMemo(() => {
    if (!user) return plans;
    if (membershipFilter === 'all') return plans;
    if (membershipFilter === 'owned')
      return plans.filter((p) => isPlanOwnedBy(p, user.id));
    return plans.filter((p) => isPlanInvitedTo(p, user.id));
  }, [plans, user, membershipFilter]);

  const filteredPlans = useMemo(() => {
    if (timeFilter === 'all') return membershipFilteredPlans;
    if (timeFilter === 'past')
      return membershipFilteredPlans.filter(isPastPlan);
    return membershipFilteredPlans.filter((p) => !isPastPlan(p));
  }, [membershipFilteredPlans, timeFilter]);

  const membershipCounts = useMemo(() => {
    if (!user) return { all: plans.length, owned: 0, invited: 0 };
    const owned = plans.filter((p) => isPlanOwnedBy(p, user.id)).length;
    const invited = plans.filter((p) => isPlanInvitedTo(p, user.id)).length;
    return { all: plans.length, owned, invited };
  }, [plans, user]);

  const timeCounts = useMemo(() => {
    const past = membershipFilteredPlans.filter(isPastPlan).length;
    return {
      all: membershipFilteredPlans.length,
      upcoming: membershipFilteredPlans.length - past,
      past,
    };
  }, [membershipFilteredPlans]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getEmptyMessage(): string {
    if (plans.length === 0) return t('plans.empty');
    if (membershipFilter === 'owned' && membershipCounts.owned === 0)
      return t('plans.emptyOwned');
    if (membershipFilter === 'invited' && membershipCounts.invited === 0)
      return t('plans.emptyInvited');
    if (membershipFilteredPlans.length === 0) return t('plans.empty');
    if (timeFilter === 'upcoming') return t('plans.emptyUpcoming');
    if (timeFilter === 'past') return t('plans.emptyPast');
    return t('plans.empty');
  }

  async function handleDeletePlan() {
    if (!deletingPlanId) return;
    try {
      await deletePlanMutation.mutateAsync(deletingPlanId);
      toast.success(t('admin.deleted'));
      setDeletingPlanId(null);
    } catch (err) {
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          {t('plans.title')}
        </h1>
        <Link
          to="/create-plan"
          className="w-full sm:w-auto inline-block text-center px-4 py-2 bg-blue-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer shadow-sm hover:shadow-md"
        >
          {t('plans.createNew')}
        </Link>
      </div>

      {plans.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div
            className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1"
            role="tablist"
            aria-label={t('plans.membershipFilterLabel')}
          >
            {MEMBERSHIP_FILTERS.map((tab) => {
              const isActive = membershipFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  data-testid={`membership-filter-${tab.value}`}
                  onClick={() => setMembershipFilter(tab.value)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
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
                    {membershipCounts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1"
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
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
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
                    {timeCounts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>
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
                <div className="flex items-center gap-2">
                  <Link
                    to="/plan/$planId"
                    params={{ planId: plan.planId }}
                    className="block group flex-1 min-w-0"
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
                  {isAdmin && (
                    <button
                      type="button"
                      data-testid={`admin-delete-${plan.planId}`}
                      onClick={() => setDeletingPlanId(plan.planId)}
                      aria-label={t('admin.deletePlan')}
                      className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={deletingPlanId !== null}
        onClose={() => setDeletingPlanId(null)}
        title={t('admin.deleteConfirmTitle')}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          <p className="text-sm text-gray-600">
            <Trans
              i18nKey="admin.deleteConfirmMessage"
              values={{ title: deletingPlan?.title ?? '' }}
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              data-testid="admin-delete-confirm"
              disabled={deletePlanMutation.isPending}
              onClick={handleDeletePlan}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {deletePlanMutation.isPending
                ? t('admin.deleting')
                : t('admin.deleteConfirm')}
            </button>
            <button
              type="button"
              data-testid="admin-delete-cancel"
              disabled={deletePlanMutation.isPending}
              onClick={() => setDeletingPlanId(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
            >
              {t('admin.deleteCancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
