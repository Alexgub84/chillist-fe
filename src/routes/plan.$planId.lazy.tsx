import { useState } from 'react';
import toast from 'react-hot-toast';
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
import { copyPlanUrl, sharePlanUrl } from '../core/invite';
import ParticipantDetails from '../components/ParticipantDetails';

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

  const actions = usePlanActions(planId);
  const bulkAssign = useBulkAssign(
    planId,
    plan && !isNotParticipantResponse(plan) ? plan.participants : []
  );

  const [itemModalId, setItemModalId] = useState<string | null>(null);
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
  const participantScopedItems = filterItemsByAssignedParticipant(
    plan.items,
    participantFilter
  );
  const listCounts = countItemsByListTab(participantScopedItems);
  const filteredItems = filterItemsByStatusTab(
    participantScopedItems,
    listFilter
  );

  const transferTargetName = (() => {
    const target = plan.participants.find(
      (x) => x.participantId === transferTargetParticipantId
    );
    return target ? `${target.name} ${target.lastName}` : '';
  })();

  async function handleItemFormSubmit(values: ItemFormValues) {
    await actions.createOrUpdateItem(
      values,
      editingItem ? editingItem.itemId : null
    );
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
    updates: import('../core/schemas/plan').PlanPatch
  ) {
    const success = await actions.updatePlanDetails(updates);
    if (success) setShowEditPlanModal(false);
  }

  async function handleTransferOwnership() {
    if (!transferTargetParticipantId) return;
    await actions.transferPlanOwnership(transferTargetParticipantId);
    setTransferTargetParticipantId(null);
  }

  async function handleCopyPlanUrl() {
    const copied = await copyPlanUrl();
    if (copied) toast.success(t('invite.copied'));
  }

  async function handleSharePlanUrl() {
    if (!plan) return;
    const planTitle = isNotParticipantResponse(plan)
      ? plan.preview.title
      : plan.title;
    const result = await sharePlanUrl(planTitle);
    if (result === 'copied') toast.success(t('invite.copied'));
  }

  return (
    <div className="w-full px-3 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <Link
            to="/plans"
            className="text-blue-500 hover:underline text-sm sm:text-base"
          >
            {t('plan.backToPlans')}
          </Link>
          <button
            type="button"
            data-testid="invite-button"
            onClick={handleCopyPlanUrl}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors shrink-0"
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {t('invite.inviteButton')}
          </button>
        </div>

        <h1
          data-testid="plan-title"
          className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2 my-4"
        >
          {plan.title}
        </h1>

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
        <div className="flex items-center gap-3 shrink-0 mt-2">
          <button
            type="button"
            data-testid="copy-plan-url-button"
            title={t('invite.copyLink')}
            onClick={handleCopyPlanUrl}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{t('invite.copyLink')}</span>
          </button>
          <button
            type="button"
            data-testid="share-plan-url-button"
            title={t('invite.shareLink')}
            onClick={handleSharePlanUrl}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
          >
            <svg
              className="w-5 h-5 shrink-0"
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
            <span>{t('invite.shareLink')}</span>
          </button>
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
              onMakeOwner={isOwner ? setTransferTargetParticipantId : undefined}
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
                  total={plan.items.length}
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

        {plan.items.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center mb-4">
            <p className="text-gray-500 text-sm sm:text-base">
              {t('items.empty')}
            </p>
          </div>
        )}

        {plan.items.length > 0 && (
          <ItemsList
            items={filteredItems}
            participants={plan.participants}
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
          />
        )}

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
                    status: editingItem.status,
                    notes: editingItem.notes ?? '',
                    assignedParticipantId:
                      editingItem.assignedParticipantId ?? '',
                  }
                : undefined
            }
            participants={plan.participants}
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
            onSubmit={handleEditPlan}
            onCancel={() => setShowEditPlanModal(false)}
            isSubmitting={actions.isUpdatingPlan}
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

      <div className="fixed bottom-6 inset-x-0 z-40 max-w-4xl mx-auto px-3 sm:px-0 pointer-events-none">
        <button
          type="button"
          onClick={() => setItemModalId('new')}
          className="pointer-events-auto ms-auto flex items-center gap-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-semibold">
            {t('items.addItemLabel')}
          </span>
        </button>
      </div>
    </div>
  );
}
