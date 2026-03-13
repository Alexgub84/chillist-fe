import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { ItemCreate } from '../core/schemas/item';
import { useTranslation } from 'react-i18next';
import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { usePlan } from '../hooks/usePlan';
import { useScrollRestore } from '../hooks/useScrollRestore';
import { usePlanRole } from '../hooks/usePlanRole';
import { usePlanActions } from '../hooks/usePlanActions';
import { useBulkAssign } from '../hooks/useBulkAssign';
import {
  isNotParticipantResponse,
  type PlanWithDetails,
} from '../core/schemas/plan';
import {
  countItemsPerParticipant,
  filterItemsByAssignedParticipant,
  countItemsByListTab,
  filterItemsByStatusTab,
  getAssignmentSelectValue,
  getItemStatus,
  buildStatusUpdate,
} from '../core/utils-plan-items';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';
import RequestToJoinPage from '../components/RequestToJoinPage';
import Forecast from '../components/Forecast';
import ItemsList from '../components/ItemsList';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import EditPlanForm from '../components/EditPlanForm';
import PreferencesForm from '../components/PreferencesForm';
import TransferOwnershipModal from '../components/TransferOwnershipModal';
import Modal from '../components/shared/Modal';
import CollapsibleSection from '../components/shared/CollapsibleSection';
import SectionLink from '../components/shared/SectionLink';
import ListTabs from '../components/StatusFilter';
import ParticipantFilter from '../components/ParticipantFilter';
import { sharePlanUrl, copyPlanUrl } from '../core/invite';
import ParticipantDetails from '../components/ParticipantDetails';
import BulkItemAddWizard from '../components/BulkItemAddWizard';
import FloatingActions from '../components/shared/FloatingActions';
import { sendList } from '../core/api';
import PlanProvider from '../contexts/PlanProvider';
import { useCreateExpense } from '../hooks/useCreateExpense';
import ExpenseForm from '../components/ExpenseForm';
import type { ExpenseFormValues } from '../components/ExpenseForm';
import { usePlanContext } from '../hooks/usePlanContext';
import {
  usePlanWebSocket,
  WS_CLOSE_PENDING_JOIN,
} from '../hooks/usePlanWebSocket';
import { getApiErrorMessage } from '../core/error-utils';
import {
  aggregateParticipantCounts,
  calculatePlanPoints,
  getDurationMultiplier,
} from '../core/utils-plan-points';

export const Route = createLazyFileRoute('/plan/$planId')({
  component: PlanPage,
  errorComponent: ErrorPage,
});

function PlanPage() {
  const { t } = useTranslation();
  const { planId } = useParams({ from: '/plan/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);
  const navigate = useNavigate({ from: '/plan/$planId' });
  const { list: listFilter, participant: participantFilter } = useSearch({
    from: '/plan/$planId',
  });

  const planParticipants =
    plan && !isNotParticipantResponse(plan) ? plan.participants : [];
  const actions = usePlanActions(planId, planParticipants);
  const bulkAssign = useBulkAssign(planId, planParticipants);

  const createExpenseMutation = useCreateExpense(planId);

  const [itemModalId, setItemModalId] = useState<string | null>(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isSendingList, setIsSendingList] = useState(false);
  const [editingParticipantId, setEditingParticipantId] = useState<
    string | null
  >(null);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [transferTargetParticipantId, setTransferTargetParticipantId] =
    useState<string | null>(null);

  const hasPlan = !!plan && !isNotParticipantResponse(plan);
  const { isOwner, currentParticipant, canEditItem } = usePlanRole(
    hasPlan ? plan : ({ participants: [] } as unknown as PlanWithDetails)
  );

  useScrollRestore(`plan-${planId}`, !isLoading && !!plan);
  const { wsCloseCode } = usePlanWebSocket(planId);
  const isPendingJoin = wsCloseCode === WS_CLOSE_PENDING_JOIN;

  const existingItems = useMemo(() => {
    if (!plan || isNotParticipantResponse(plan))
      return new Map<string, string>();
    return new Map(plan.items.map((i) => [i.name.toLowerCase(), i.itemId]));
  }, [plan]);

  if (isLoading) {
    return <div className="text-center">{t('plan.loading')}</div>;
  }

  if (error) {
    throw error;
  }

  if (!plan) {
    throw new Error(t('plan.notFound'));
  }

  if (isNotParticipantResponse(plan)) {
    return <RequestToJoinPage planId={planId} response={plan} />;
  }

  const { totalAdults, totalKids } = aggregateParticipantCounts(
    plan.participants
  );
  const planPoints = calculatePlanPoints({
    adultsCount: totalAdults,
    kidsCount: totalKids,
    durationMultiplier: getDurationMultiplier(plan.startDate, plan.endDate),
  });

  const planDetailsOpen =
    isOwner || currentParticipant?.rsvpStatus !== 'confirmed';

  const isCreating = itemModalId === 'new';
  const editingItem =
    itemModalId && itemModalId !== 'new'
      ? plan.items.find((i) => i.itemId === itemModalId)
      : null;
  const editingParticipant = editingParticipantId
    ? plan.participants.find((p) => p.participantId === editingParticipantId)
    : null;

  const participantCounts = countItemsPerParticipant(
    plan.participants,
    plan.items
  );
  const myParticipantId = currentParticipant?.participantId;
  const statusParticipantId =
    participantFilter && participantFilter !== 'unassigned'
      ? participantFilter
      : myParticipantId;
  const nonCanceledCount = plan.items.filter(
    (i) => getItemStatus(i, myParticipantId) !== 'canceled'
  ).length;
  const participantScopedItems = filterItemsByAssignedParticipant(
    plan.items,
    participantFilter
  );
  const listCounts = countItemsByListTab(
    participantScopedItems,
    statusParticipantId
  );
  const filteredItems = filterItemsByStatusTab(
    participantScopedItems,
    listFilter,
    statusParticipantId
  );

  const planItems = plan.items;
  async function handleBulkCancel(itemIds: string[]) {
    for (const itemId of itemIds) {
      const item = planItems.find((i) => i.itemId === itemId);
      if (!item) continue;
      await actions.updateSingleItem(
        itemId,
        buildStatusUpdate(item, 'canceled', statusParticipantId)
      );
    }
  }

  const transferTargetName = (() => {
    const target = plan.participants.find(
      (x) => x.participantId === transferTargetParticipantId
    );
    return target ? `${target.name} ${target.lastName}` : '';
  })();

  async function handleItemFormSubmit(values: ItemFormValues) {
    await actions.createOrUpdateItem(values, editingItem ?? null);
    setItemModalId(null);
  }

  async function handlePreferencesSubmit(
    values: import('../components/PreferencesForm').PreferencesFormValues
  ) {
    if (!editingParticipantId) return;
    await actions.updateParticipantPreferences(editingParticipantId, values);
    setEditingParticipantId(null);
  }

  async function handleDeletePlan() {
    const success = await actions.deletePlan();
    if (success) navigate({ to: '/plans' });
  }

  async function handleEditPlan(
    payload: import('../components/EditPlanForm').EditPlanSubmitPayload
  ) {
    const success = await actions.updatePlanDetails(payload.planPatch);
    if (!success) return;

    if (!plan || isNotParticipantResponse(plan)) {
      setShowEditPlanModal(false);
      return;
    }

    const ownerId = plan.participants.find(
      (p: { role: string }) => p.role === 'owner'
    )?.participantId;
    if (ownerId) {
      await actions.updateParticipantPreferences(ownerId, {
        adultsCount: payload.ownerPreferences.adultsCount ?? undefined,
        kidsCount: payload.ownerPreferences.kidsCount ?? undefined,
        foodPreferences: payload.ownerPreferences.foodPreferences ?? undefined,
        allergies: payload.ownerPreferences.allergies ?? undefined,
        notes: payload.ownerPreferences.notes ?? undefined,
      });
    }

    setShowEditPlanModal(false);
  }

  async function handleTransferOwnership() {
    if (!transferTargetParticipantId) return;
    await actions.transferPlanOwnership(transferTargetParticipantId);
    setTransferTargetParticipantId(null);
  }

  async function handleSendList(participantId: string) {
    if (!plan || isNotParticipantResponse(plan)) return;
    const participant = plan.participants.find(
      (p) => p.participantId === participantId
    );
    if (!participant) return;
    const name = participant.displayName || participant.name;
    if (!participant.contactPhone) {
      toast.error(t('sendList.noPhone', { name }));
      return;
    }
    setIsSendingList(true);
    try {
      const result = await sendList(planId, participant.contactPhone);
      if (result.sent) {
        toast.success(t('sendList.success', { name }));
      } else {
        toast.error(t('sendList.error', { name }));
      }
    } catch {
      toast.error(t('sendList.error', { name }));
    } finally {
      setIsSendingList(false);
    }
  }

  async function handleSendListToMe() {
    if (!currentParticipant) return;
    if (!currentParticipant.contactPhone) {
      toast.error(t('sendList.noPhoneMe'));
      return;
    }
    setIsSendingList(true);
    try {
      const result = await sendList(planId, currentParticipant.contactPhone);
      if (result.sent) {
        toast.success(t('sendList.successMe'));
      } else {
        toast.error(t('sendList.errorMe'));
      }
    } catch {
      toast.error(t('sendList.errorMe'));
    } finally {
      setIsSendingList(false);
    }
  }

  async function handleSendListAll() {
    if (!plan || isNotParticipantResponse(plan)) return;
    const withPhone = plan.participants.filter((p) => p.contactPhone);
    if (withPhone.length === 0) return;

    setIsSendingList(true);
    let successCount = 0;
    for (const p of withPhone) {
      try {
        const result = await sendList(planId, p.contactPhone);
        if (result.sent) successCount++;
      } catch {
        // continue to next participant
      }
    }
    setIsSendingList(false);
    toast.success(
      t('sendList.successAll', {
        count: successCount,
        total: withPhone.length,
      })
    );
  }

  async function handleSharePlanUrl() {
    if (!plan) return;
    const planTitle = isNotParticipantResponse(plan)
      ? plan.preview.title
      : plan.title;
    const result = await sharePlanUrl(planTitle);
    if (result === 'copied') toast.success(t('invite.copied'));
  }

  async function handleCopyPlanUrl() {
    const copied = await copyPlanUrl();
    if (copied) toast.success(t('invite.planUrlCopied'));
  }

  async function handleBulkAdd(payloads: ItemCreate[]) {
    const results = await Promise.allSettled(
      payloads.map((payload) => actions.createItem(payload))
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed === 0) {
      toast.success(t('items.bulkAddSuccess', { count: succeeded }));
    } else if (succeeded > 0) {
      toast.error(
        t('items.bulkAddPartial', {
          successCount: succeeded,
          errorCount: failed,
        })
      );
    } else {
      toast.error(t('items.bulkAddError'));
      const firstErr = results.find((r) => r.status === 'rejected');
      if (firstErr && firstErr.status === 'rejected') {
        console.error(
          '[PlanPage] handleBulkAdd failed. Error:',
          firstErr.reason
        );
      }
    }
  }

  async function handleAddExpense(values: ExpenseFormValues) {
    try {
      await createExpenseMutation.mutateAsync(values);
      toast.success(t('expenses.addSuccess'));
      setAddExpenseOpen(false);
    } catch (err) {
      console.error(
        `[PlanPage] createExpense failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  return (
    <PlanProvider plan={plan}>
      <div className="w-full px-3 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
            <Link
              to="/plans"
              className="text-blue-500 hover:underline text-sm sm:text-base"
            >
              {t('plan.backToPlans')}
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="copy-plan-url-button"
                onClick={handleCopyPlanUrl}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t('invite.copyPlanUrl')}
                </span>
              </button>
              <button
                type="button"
                data-testid="invite-button"
                onClick={handleSharePlanUrl}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t('invite.inviteParticipants')}
                </span>
              </button>
            </div>
          </div>

          <h1
            data-testid="plan-title"
            className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2 my-4"
          >
            {plan.title}
          </h1>

          {isPendingJoin && (
            <div
              data-testid="pending-join-banner"
              className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {t('plan.pendingJoinApproval')}
            </div>
          )}

          <CollapsibleSection
            title={
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                {t('plan.planDetails')}
              </h2>
            }
            defaultOpen={planDetailsOpen}
            wrapperClassName="bg-white rounded-xl shadow-sm overflow-hidden"
            panelContentClassName="border-t border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <Plan
              plan={plan}
              isOwner={isOwner}
              onEdit={() => setShowEditPlanModal(true)}
              onDelete={handleDeletePlan}
              isDeleting={actions.isDeletingPlan}
            />
          </CollapsibleSection>

          <div
            data-testid="headcount-section"
            className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm p-4 sm:p-6"
          >
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              {t('plan.headcount')}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {t('plan.reported')}
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalAdults}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('plan.reportedAdults')}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalKids}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('plan.reportedKids')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {t('plan.estimated')}
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {plan.estimatedAdults ?? (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('plan.estimatedAdults')}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {plan.estimatedKids ?? (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('plan.estimatedKids')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <Forecast
              location={plan.location}
              startDate={plan.startDate}
              endDate={plan.endDate}
            />
          </div>

          {!isOwner == plan.participants.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <ParticipantDetails
                participants={plan.participants}
                planId={planId}
                planTitle={plan.title}
                isOwner={isOwner}
                currentParticipantId={currentParticipant?.participantId}
                onEditPreferences={setEditingParticipantId}
                onMakeOwner={
                  isOwner ? setTransferTargetParticipantId : undefined
                }
                onSendList={
                  isOwner && plan.items.length > 0 ? handleSendList : undefined
                }
                onSendListAll={
                  isOwner && plan.items.length > 0
                    ? handleSendListAll
                    : undefined
                }
                onSendListToMe={
                  !isOwner && plan.items.length > 0
                    ? handleSendListToMe
                    : undefined
                }
                isSendingList={isSendingList}
              />
            </div>
          )}

          {isOwner && plan.participants.length > 0 && (
            <SectionLink
              to="/manage-participants/$planId"
              params={{ planId }}
              testId="manage-participants-link"
              colorScheme="amber"
              className="mt-4 sm:mt-5 mb-4"
              icon={
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
              title={t('manageParticipants.linkTitle')}
              subtitle={t('manageParticipants.linkDesc')}
            />
          )}

          <SectionLink
            to="/items/$planId"
            params={{ planId }}
            colorScheme="blue"
            className="mt-6 sm:mt-8 mb-4"
            icon={
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            title={t('items.manageItems')}
            subtitle={t('items.manageItemsDesc')}
          />

          <SectionLink
            to="/expenses/$planId"
            params={{ planId }}
            testId="expenses-link"
            colorScheme="green"
            className="mb-4"
            icon={
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title={t('expenses.linkTitle')}
            subtitle={t('expenses.linkDesc')}
          />

          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {t('items.title')}
              {plan.items.length > 0 && (
                <span
                  data-testid="items-count"
                  className="ms-2 text-sm font-normal text-gray-500"
                >
                  ({plan.items.length})
                </span>
              )}
            </h2>
          </div>

          {plan.items.length > 0 && (
            <div className="mb-4 sm:mb-6 space-y-3">
              {plan.participants.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {t('plan.filterByPerson')}
                  </p>
                  <ParticipantFilter
                    participants={plan.participants}
                    selected={participantFilter ?? null}
                    onChange={(participantId) =>
                      navigate({
                        search: {
                          list: listFilter,
                          participant: participantId ?? undefined,
                        },
                        replace: true,
                      })
                    }
                    counts={participantCounts}
                    total={nonCanceledCount}
                    currentParticipantId={currentParticipant?.participantId}
                  />
                </div>
              )}
              {plan.participants.length > 0 && (
                <div className="border-t border-gray-200" />
              )}
              <div>
                <ListTabs
                  selected={listFilter ?? null}
                  onChange={(filter) =>
                    navigate({
                      search: {
                        list: filter ?? undefined,
                        participant: participantFilter,
                      },
                      replace: true,
                    })
                  }
                  counts={listCounts}
                  total={participantScopedItems.length}
                />
              </div>
            </div>
          )}

          <ItemsList
            items={plan.items.length > 0 ? filteredItems : []}
            participants={plan.participants}
            currentParticipantId={statusParticipantId}
            listFilter={listFilter}
            selfAssignParticipantId={
              isOwner ? undefined : currentParticipant?.participantId
            }
            canEditItem={canEditItem}
            onEditItem={(itemId) => setItemModalId(itemId)}
            onUpdateItem={actions.updateSingleItem}
            onBulkAssign={(ids, pid) =>
              bulkAssign.mutate({ itemIds: ids, participantId: pid })
            }
            groupBySubcategory
            onAddItems={
              plan.items.length === 0 ? () => setBulkAddOpen(true) : undefined
            }
          />

          <Modal
            open={!!itemModalId}
            onClose={() => setItemModalId(null)}
            title={isCreating ? t('items.addItemLabel') : t('items.editItem')}
            testId="add-item-modal"
          >
            <ItemForm
              key={itemModalId ?? 'closed'}
              defaultValues={
                editingItem
                  ? {
                      name: editingItem.name,
                      category: editingItem.category,
                      subcategory:
                        (editingItem as { subcategory?: string | null })
                          .subcategory ?? undefined,
                      quantity: editingItem.quantity,
                      unit: editingItem.unit,
                      notes: editingItem.notes ?? '',
                      assignedParticipantId:
                        getAssignmentSelectValue(editingItem),
                    }
                  : undefined
              }
              participants={plan.participants}
              showAssignAll={isOwner}
              onSubmit={handleItemFormSubmit}
              onCancel={() => setItemModalId(null)}
              isSubmitting={
                isCreating ? actions.isCreatingItem : actions.isUpdatingItem
              }
              submitLabel={isCreating ? undefined : t('items.updateItem')}
            />
          </Modal>

          <Modal
            open={!!editingParticipant}
            onClose={() => setEditingParticipantId(null)}
            title={`${editingParticipant?.name ?? ''} ${editingParticipant?.lastName ?? ''}`}
          >
            {editingParticipant && (
              <PreferencesForm
                key={editingParticipant.participantId}
                defaultValues={{
                  adultsCount: editingParticipant.adultsCount ?? undefined,
                  kidsCount: editingParticipant.kidsCount ?? undefined,
                  foodPreferences:
                    editingParticipant.foodPreferences ?? undefined,
                  allergies: editingParticipant.allergies ?? undefined,
                  notes: editingParticipant.notes ?? undefined,
                }}
                onSubmit={handlePreferencesSubmit}
                onCancel={() => setEditingParticipantId(null)}
                isSubmitting={actions.isUpdatingParticipant}
                inModal
                showRsvp
              />
            )}
          </Modal>

          <Modal
            open={showEditPlanModal}
            onClose={() => setShowEditPlanModal(false)}
            title={t('plan.editPlan')}
          >
            <EditPlanForm
              key={showEditPlanModal ? 'open' : 'closed'}
              plan={plan}
              ownerParticipant={
                plan.participants.find((p) => p.role === 'owner') ?? null
              }
              onSubmit={handleEditPlan}
              onCancel={() => setShowEditPlanModal(false)}
              isSubmitting={actions.isUpdatingPlan}
            />
          </Modal>

          <Modal
            open={addExpenseOpen}
            onClose={() => setAddExpenseOpen(false)}
            title={t('expenses.addExpense')}
            testId="quick-add-expense-modal"
          >
            <QuickAddExpenseForm
              plan={plan}
              isOwner={isOwner}
              currentParticipantId={currentParticipant?.participantId}
              onSubmit={handleAddExpense}
              onCancel={() => setAddExpenseOpen(false)}
              isSubmitting={createExpenseMutation.isPending}
            />
          </Modal>

          <TransferOwnershipModal
            open={transferTargetParticipantId !== null}
            onClose={() => setTransferTargetParticipantId(null)}
            onConfirm={handleTransferOwnership}
            participantName={transferTargetName}
            isPending={actions.isUpdatingParticipant}
          />
        </div>

        <FloatingActions
          onAddItem={() => setItemModalId('new')}
          onBulkAdd={() => setBulkAddOpen(true)}
          onAddExpense={() => setAddExpenseOpen(true)}
        />

        <BulkItemAddWizard
          open={bulkAddOpen}
          onClose={() => setBulkAddOpen(false)}
          onAdd={handleBulkAdd}
          existingItems={existingItems}
          onCancel={handleBulkCancel}
          planPoints={planPoints}
        />
      </div>
    </PlanProvider>
  );
}

function QuickAddExpenseForm({
  plan,
  isOwner,
  currentParticipantId,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  plan: PlanWithDetails;
  isOwner: boolean;
  currentParticipantId?: string;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const planCtx = usePlanContext();
  return (
    <ExpenseForm
      participants={plan.participants}
      items={plan.items}
      isOwner={isOwner}
      currentParticipantId={currentParticipantId}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      currency={planCtx?.planCurrency ?? ''}
    />
  );
}
