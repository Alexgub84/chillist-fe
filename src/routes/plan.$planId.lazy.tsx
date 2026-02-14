import { useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { usePlan } from '../hooks/usePlan';
import { useCreateItem } from '../hooks/useCreateItem';
import { useUpdateItem } from '../hooks/useUpdateItem';
import { getApiErrorMessage } from '../core/error-utils';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';
import CategorySection from '../components/CategorySection';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import StatusFilter from '../components/StatusFilter';
import type {
  ItemCategory,
  ItemCreate,
  ItemPatch,
  ItemStatus,
} from '../core/schemas/item';

export const Route = createLazyFileRoute('/plan/$planId')({
  component: PlanDetails,
  errorComponent: ErrorPage,
});

function PlanDetails() {
  const { planId } = useParams({ from: '/plan/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);
  const createItem = useCreateItem(planId);
  const updateItemMutation = useUpdateItem(planId);
  const { status: statusFilter } = useSearch({ from: '/plan/$planId' });
  const navigate = useNavigate();
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center">Loading plan details...</div>;
  }

  if (error) {
    throw error;
  }

  if (!plan) {
    throw new Error('Plan not found');
  }

  async function handleAddItem(values: ItemFormValues) {
    const payload: ItemCreate = {
      name: values.name,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      status: values.status,
      notes: values.notes || null,
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
    });
    setEditingItemId(null);
  }

  const editingItem = editingItemId
    ? plan.items.find((i) => i.itemId === editingItemId)
    : null;

  const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

  const statusCounts: Record<ItemStatus, number> = {
    pending: 0,
    purchased: 0,
    packed: 0,
    canceled: 0,
  };
  for (const item of plan.items) {
    statusCounts[item.status]++;
  }

  const filteredItems = statusFilter
    ? plan.items.filter((item) => item.status === statusFilter)
    : plan.items;

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
            ← Back to Plans
          </Link>
        </div>
        <Plan plan={plan} />

        <div className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Items
              {plan.items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({plan.items.length})
                </span>
              )}
            </h2>
          </div>

          {plan.items.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <StatusFilter
                selected={statusFilter ?? null}
                onChange={(status) =>
                  navigate({
                    search: { status: status ?? undefined },
                    replace: true,
                  })
                }
                counts={statusCounts}
                total={plan.items.length}
              />
            </div>
          )}

          {plan.items.length === 0 && !showItemForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center mb-4">
              <p className="text-gray-500 text-sm sm:text-base">
                No items yet. Add one to get started!
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
                  onEditItem={handleStartEdit}
                  onUpdateItem={updateItem}
                />
              ))}
            </div>
          )}

          {editingItem ? (
            <ItemForm
              key={editingItem.itemId}
              defaultValues={{
                name: editingItem.name,
                category: editingItem.category,
                quantity: editingItem.quantity,
                unit: editingItem.unit,
                status: editingItem.status,
                notes: editingItem.notes ?? '',
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => setEditingItemId(null)}
              isSubmitting={updateItemMutation.isPending}
              submitLabel="Update Item"
            />
          ) : showItemForm ? (
            <ItemForm
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
              + Add Item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
