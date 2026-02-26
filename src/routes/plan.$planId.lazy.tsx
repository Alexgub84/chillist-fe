import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { usePlan } from '../hooks/usePlan';
import { useScrollRestore } from '../hooks/useScrollRestore';
import { useCreateItem } from '../hooks/useCreateItem';
import { useUpdateItem } from '../hooks/useUpdateItem';
import { useCreateParticipant } from '../hooks/useCreateParticipant';
import { useUpdateParticipant } from '../hooks/useUpdateParticipant';
import { useDeletePlan } from '../hooks/useDeletePlan';
import { useUpdatePlan } from '../hooks/useUpdatePlan';
import { useAuth } from '../contexts/useAuth';
import { getApiErrorMessage } from '../core/error-utils';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';
import Forecast from '../components/Forecast';
import ParticipantDetails from '../components/ParticipantDetails';
import ItemsList from '../components/ItemsList';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import EditPlanForm from '../components/EditPlanForm';
import PreferencesForm, {
  type PreferencesFormValues,
} from '../components/PreferencesForm';
import Modal from '../components/shared/Modal';
import ListTabs from '../components/StatusFilter';
import ParticipantFilter from '../components/ParticipantFilter';
import type { Item, ItemPatch } from '../core/schemas/item';
import type { PlanPatch } from '../core/schemas/plan';
import type { ListFilter } from '../core/schemas/plan-search';

export const Route = createLazyFileRoute('/plan/$planId')({
  component: PlanDetails,
  errorComponent: ErrorPage,
});

function PlanDetails() {
  const { t } = useTranslation();
  const { planId } = useParams({ from: '/plan/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);
  const createItem = useCreateItem(planId);
  const updateItemMutation = useUpdateItem(planId);
  const createParticipantMutation = useCreateParticipant(planId);
  const updateParticipantMutation = useUpdateParticipant(planId);
  const deletePlanMutation = useDeletePlan();
  const updatePlanMutation = useUpdatePlan(planId);
  const { user } = useAuth();
  const { list: listFilter, participant: participantFilter } = useSearch({
    from: '/plan/$planId',
  });
  const navigate = useNavigate({ from: '/plan/$planId' });
  const [itemModalId, setItemModalId] = useState<string | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<
    string | null
  >(null);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);

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

  const isCreating = itemModalId === 'new';
  const editingItem =
    itemModalId && itemModalId !== 'new'
      ? plan.items.find((i) => i.itemId === itemModalId)
      : null;

  function closeItemModal() {
    setItemModalId(null);
  }

  async function updateItem(itemId: string, updates: ItemPatch) {
    try {
      await updateItemMutation.mutateAsync({ itemId, updates });
    } catch (err) {
      console.error(
        `[PlanPage] updateItem failed — planId="${planId}", itemId="${itemId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  function toPayload(values: ItemFormValues) {
    return {
      name: values.name,
      category: values.category,
      subcategory: values.subcategory || null,
      quantity: values.quantity,
      unit: values.unit,
      status: values.status,
      notes: values.notes || null,
      assignedParticipantId: values.assignedParticipantId || null,
    };
  }

  async function handleItemFormSubmit(values: ItemFormValues) {
    if (isCreating) {
      await createItem.mutateAsync(toPayload(values));
    } else if (editingItem) {
      await updateItem(editingItem.itemId, toPayload(values));
    }
    closeItemModal();
  }

  const editingParticipant = editingParticipantId
    ? plan.participants.find((p) => p.participantId === editingParticipantId)
    : null;

  async function handlePreferencesSubmit(values: PreferencesFormValues) {
    if (!editingParticipantId) return;
    try {
      await updateParticipantMutation.mutateAsync({
        participantId: editingParticipantId,
        updates: {
          adultsCount: values.adultsCount ?? null,
          kidsCount: values.kidsCount ?? null,
          foodPreferences: values.foodPreferences || null,
          allergies: values.allergies || null,
          notes: values.notes || null,
        },
      });
      toast.success(t('preferences.updated'));
    } catch (err) {
      console.error(
        `[PlanPage] handlePreferencesSubmit failed — planId="${planId}", participantId="${editingParticipantId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
    setEditingParticipantId(null);
  }

  const owner = plan.participants.find((p) => p.role === 'owner');
  const isOwner = !!user && !!owner?.userId && user.id === owner.userId;
  const currentParticipant = user
    ? plan.participants.find((p) => p.userId === user.id)
    : undefined;

  const canEditItem = isOwner
    ? undefined
    : (item: Item) =>
        !!currentParticipant &&
        item.assignedParticipantId === currentParticipant.participantId;

  async function handleDeletePlan() {
    try {
      await deletePlanMutation.mutateAsync(planId);
      toast.success(t('plan.deleted'));
      navigate({ to: '/plans' });
    } catch (err) {
      console.error(
        `[PlanPage] handleDeletePlan failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  async function handleEditPlan(updates: PlanPatch) {
    try {
      await updatePlanMutation.mutateAsync(updates);
      toast.success(t('plan.updated'));
      setShowEditPlanModal(false);
    } catch (err) {
      console.error(
        `[PlanPage] handleEditPlan failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    }
  }

  const participantCounts: Record<string, number> = { unassigned: 0 };
  for (const p of plan.participants) {
    participantCounts[p.participantId] = 0;
  }
  for (const item of plan.items) {
    if (item.assignedParticipantId) {
      participantCounts[item.assignedParticipantId] =
        (participantCounts[item.assignedParticipantId] ?? 0) + 1;
    } else {
      participantCounts['unassigned']++;
    }
  }

  const participantScopedItems = plan.items.filter((item) => {
    if (!participantFilter) return true;
    if (participantFilter === 'unassigned') return !item.assignedParticipantId;
    return item.assignedParticipantId === participantFilter;
  });

  const listCounts: Record<ListFilter, number> = {
    buying: 0,
    packing: 0,
  };
  for (const item of participantScopedItems) {
    if (item.status === 'pending') listCounts.buying++;
    if (item.status === 'purchased') listCounts.packing++;
  }

  const filteredItems = participantScopedItems.filter((item) => {
    if (listFilter === 'buying' && item.status !== 'pending') return false;
    if (listFilter === 'packing' && item.status !== 'purchased') return false;
    return true;
  });

  return (
    <div className="w-full px-3 sm:px-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            to="/plans"
            className="text-blue-500 hover:underline text-sm sm:text-base"
          >
            {t('plan.backToPlans')}
          </Link>
        </div>
        <Plan
          plan={plan}
          onAddParticipant={async (p) => {
            await createParticipantMutation.mutateAsync(p);
          }}
          isAddingParticipant={createParticipantMutation.isPending}
          isOwner={isOwner}
          onEdit={() => setShowEditPlanModal(true)}
          onDelete={handleDeletePlan}
          isDeleting={deletePlanMutation.isPending}
        />

        <div className="mt-4 sm:mt-6">
          <Forecast
            location={plan.location}
            startDate={plan.startDate}
            endDate={plan.endDate}
          />
        </div>

        {plan.participants.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <ParticipantDetails
              participants={plan.participants}
              planId={planId}
              planTitle={plan.title}
              isOwner={isOwner}
              currentParticipantId={currentParticipant?.participantId}
              onEditPreferences={setEditingParticipantId}
            />
          </div>
        )}

        <Link
          to="/items/$planId"
          params={{ planId }}
          className="mt-6 sm:mt-8 mb-4 block bg-white rounded-lg shadow-sm border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all p-4 sm:p-5 group"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
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
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                {t('items.manageItems')}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {t('items.manageItemsDesc')}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-500 ms-auto shrink-0 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {t('items.title')}
            {plan.items.length > 0 && (
              <span className="ms-2 text-sm font-normal text-gray-500">
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
            onUpdateItem={updateItem}
            groupBySubcategory
          />
        )}

        <Modal
          open={!!itemModalId}
          onClose={closeItemModal}
          title={isCreating ? t('items.addItemLabel') : t('items.editItem')}
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
            onCancel={closeItemModal}
            isSubmitting={
              isCreating ? createItem.isPending : updateItemMutation.isPending
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
              isSubmitting={updateParticipantMutation.isPending}
              inModal
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
            isSubmitting={updatePlanMutation.isPending}
          />
        </Modal>
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
