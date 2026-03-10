import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createLazyFileRoute,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { usePlan } from '../hooks/usePlan';
import { useInvitePlan } from '../hooks/useInvitePlan';
import { useScrollRestore } from '../hooks/useScrollRestore';
import { useCreateItem } from '../hooks/useCreateItem';
import { useUpdateItem } from '../hooks/useUpdateItem';
import { addGuestItem, updateGuestItem } from '../core/api';
import { getApiErrorMessage } from '../core/error-utils';
import type { Participant } from '../core/schemas/participant';
import {
  isNotParticipantResponse,
  type PlanWithDetails,
} from '../core/schemas/plan';
import type { ItemCreate, ItemPatch } from '../core/schemas/item';
import { useQueryClient } from '@tanstack/react-query';
import { useBulkAssign } from '../hooks/useBulkAssign';
import { usePlanRole } from '../hooks/usePlanRole';
import { usePlanWebSocket } from '../hooks/usePlanWebSocket';
import {
  aggregateParticipantCounts,
  calculatePlanPoints,
  getDurationMultiplier,
} from '../core/utils-plan-points';
import ErrorPage from './ErrorPage';
import ItemsView from '../components/ItemsView';

export const Route = createLazyFileRoute('/items/$planId')({
  component: ItemsPage,
  errorComponent: ErrorPage,
});

function ItemsPage() {
  const { planId } = useParams({ from: '/items/$planId' });
  const { token } = useSearch({ from: '/items/$planId' });
  const isGuest = !!token;

  if (isGuest) {
    return <GuestItemsPage planId={planId} inviteToken={token} />;
  }

  return <AuthItemsPage planId={planId} />;
}

function AuthItemsPage({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const { data: plan, isLoading, error } = usePlan(planId);
  const createItem = useCreateItem(planId);
  const updateItemMutation = useUpdateItem(planId);
  const hasPlan = !!plan && !isNotParticipantResponse(plan);
  const bulkAssign = useBulkAssign(planId, hasPlan ? plan.participants : []);
  const { isOwner, currentParticipant } = usePlanRole(
    hasPlan ? plan : ({ participants: [] } as unknown as PlanWithDetails)
  );

  useScrollRestore(`items-${planId}`, !isLoading && !!plan);
  usePlanWebSocket(planId);

  if (isLoading) {
    return <div className="text-center py-10">{t('plan.loading')}</div>;
  }

  if (error) throw error;
  if (!plan) throw new Error(t('plan.notFound'));

  if (isNotParticipantResponse(plan)) {
    return null;
  }

  const { totalAdults, totalKids } = aggregateParticipantCounts(
    plan.participants
  );
  const planPointsValue = calculatePlanPoints({
    adultsCount: totalAdults,
    kidsCount: totalKids,
    durationMultiplier: getDurationMultiplier(plan.startDate, plan.endDate),
  });

  return (
    <ItemsView
      planId={planId}
      planTitle={plan.title}
      items={plan.items}
      participants={plan.participants}
      isGuest={false}
      selfParticipantId={
        isOwner ? undefined : currentParticipant?.participantId
      }
      backLink={{ kind: 'plan', planId }}
      onCreateItem={async (payload) => {
        await createItem.mutateAsync(payload);
      }}
      onUpdateItem={async (itemId, updates) => {
        await updateItemMutation.mutateAsync({ itemId, updates });
      }}
      onBulkAssign={(ids, pid) =>
        bulkAssign.mutate({ itemIds: ids, participantId: pid })
      }
      isCreating={createItem.isPending}
      planPoints={planPointsValue}
    />
  );
}

function GuestItemsPage({
  planId,
  inviteToken,
}: {
  planId: string;
  inviteToken: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: plan, isLoading, error } = useInvitePlan(planId, inviteToken);

  useScrollRestore(`items-guest-${planId}`, !isLoading && !!plan);

  const participantsAsFullType: Participant[] = useMemo(
    () =>
      (plan?.participants ?? []).map((p) => ({
        participantId: p.participantId,
        planId,
        name: p.displayName ?? '?',
        lastName: '',
        contactPhone: '',
        role: p.role,
        rsvpStatus: 'pending' as const,
        createdAt: '',
        updatedAt: '',
      })),
    [plan?.participants, planId]
  );

  if (isLoading) {
    return <div className="text-center py-10">{t('plan.loading')}</div>;
  }

  if (error || !plan) {
    console.error(
      `[ItemsPage] Cannot display items — planId="${planId}", token="${inviteToken.slice(0, 8)}…". ` +
        `Error: ${error ? `${error.name}: ${error.message}` : 'plan data is null/undefined'}`
    );
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {t('invite.invalidLink')}
        </h1>
      </div>
    );
  }

  async function handleCreateItem(payload: ItemCreate) {
    try {
      await addGuestItem(planId, inviteToken, {
        name: payload.name,
        category: payload.category,
        quantity: payload.quantity,
        unit: payload.unit ?? 'pcs',
        notes: payload.notes ?? undefined,
      });
      toast.success(t('invite.itemAdded'));
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[ItemsPage] addGuestItem failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleUpdateItem(itemId: string, updates: ItemPatch) {
    try {
      await updateGuestItem(planId, inviteToken, itemId, { ...updates });
      queryClient.invalidateQueries({
        queryKey: ['invite', planId, inviteToken],
      });
    } catch (err) {
      console.error(
        `[ItemsPage] updateGuestItem failed — planId="${planId}", itemId="${itemId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  return (
    <ItemsView
      planId={planId}
      planTitle={plan.title}
      items={plan.items}
      participants={participantsAsFullType}
      isGuest
      guestParticipantId={plan.myParticipantId}
      backLink={{ kind: 'invite', planId, inviteToken }}
      onCreateItem={handleCreateItem}
      onUpdateItem={handleUpdateItem}
    />
  );
}
