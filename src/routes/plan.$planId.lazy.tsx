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
import CategorySection from '../components/CategorySection';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import Modal from '../components/shared/Modal';
import ListTabs from '../components/StatusFilter';
import ParticipantFilter from '../components/ParticipantFilter';
import type { ItemCategory, ItemCreate, ItemPatch } from '../core/schemas/item';
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
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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

  async function handleAddItem(values: ItemFormValues) {
    const payload: ItemCreate = {
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      status: values.status,
      notes: values.notes || null,
      assignedParticipantId: values.assignedParticipantId || null,
    };
    await createItem.mutateAsync(payload);
    setShowItemForm(false);
  }

  function handleStartEdit(itemId: string) {
    setShowItemForm(false);
    setEditingItemId(itemId);
  }

  function handleStartCreate() {
    setEditingItemId(null);
    setShowItemForm(true);
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

  async function handleFormSubmit(values: ItemFormValues) {
    if (!editingItemId) return;
    await updateItem(editingItemId, {
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      status: values.status,
      notes: values.notes || null,
      assignedParticipantId: values.assignedParticipantId || null,
    });
    setEditingItemId(null);
  }

  const editingItem = editingItemId
    ? plan.items.find((i) => i.itemId === editingItemId)
    : null;

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

        <div className="mt-6 sm:mt-8">
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

          {plan.items.length === 0 && !showItemForm && (
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
                  onEditItem={handleStartEdit}
                  onUpdateItem={updateItem}
                />
              ))}
            </div>
          )}

          {showItemForm ? (
            <ItemForm
              participants={plan.participants}
              onSubmit={handleAddItem}
              onCancel={() => setShowItemForm(false)}
              isSubmitting={createItem.isPending}
            />
          ) : (
            <button
              type="button"
              onClick={handleStartCreate}
              className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm hover:shadow-md"
            >
              {t('items.addItem')}
            </button>
          )}

          <Modal
            open={!!editingItem}
            onClose={() => setEditingItemId(null)}
            title={t('items.editItem')}
          >
            {editingItem && (
              <ItemForm
                key={editingItem.itemId}
                defaultValues={{
                  name: editingItem.name,
                  category: editingItem.category,
                  quantity: editingItem.quantity,
                  unit: editingItem.unit,
                  status: editingItem.status,
                  notes: editingItem.notes ?? '',
                  assignedParticipantId:
                    editingItem.assignedParticipantId ?? '',
                }}
                participants={plan.participants}
                onSubmit={handleFormSubmit}
                onCancel={() => setEditingItemId(null)}
                isSubmitting={updateItemMutation.isPending}
                submitLabel={t('items.updateItem')}
                inModal
              />
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}
