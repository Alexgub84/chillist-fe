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
import { getApiErrorMessage } from '../core/error-utils';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';
import Forecast from '../components/Forecast';
import CategorySection from '../components/CategorySection';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import Modal from '../components/shared/Modal';
import ListTabs from '../components/StatusFilter';
import ParticipantFilter from '../components/ParticipantFilter';
import type { ItemCategory, ItemPatch } from '../core/schemas/item';
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
  const { list: listFilter, participant: participantFilter } = useSearch({
    from: '/plan/$planId',
  });
  const navigate = useNavigate({ from: '/plan/$planId' });
  const [itemModalId, setItemModalId] = useState<string | null>(null);

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

  const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

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

  const itemsByCategory = CATEGORIES.map((category) => ({
    category,
    items: filteredItems.filter((item) => item.category === category),
  }));

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
        />

        <div className="mt-4 sm:mt-6">
          <Forecast
            location={plan.location}
            startDate={plan.startDate}
            endDate={plan.endDate}
          />
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-between mb-3 sm:mb-4">
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
          <div className="space-y-4 mb-4">
            {itemsByCategory.map(({ category, items }) => (
              <CategorySection
                key={category}
                category={category}
                items={items}
                participants={plan.participants}
                listFilter={listFilter}
                onEditItem={(itemId) => setItemModalId(itemId)}
                onUpdateItem={updateItem}
              />
            ))}
          </div>
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
