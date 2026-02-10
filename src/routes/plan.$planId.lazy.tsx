import { useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { Link, useParams } from '@tanstack/react-router';
import { usePlan } from '../hooks/usePlan';
import { useCreateItem } from '../hooks/useCreateItem';
import ErrorPage from './ErrorPage';
import { Plan } from '../components/Plan';
import CategorySection from '../components/CategorySection';
import ItemForm, { type ItemFormValues } from '../components/ItemForm';
import type { ItemCategory, ItemCreate } from '../core/schemas/item';

export const Route = createLazyFileRoute('/plan/$planId')({
  component: PlanDetails,
  errorComponent: ErrorPage,
});

function PlanDetails() {
  const { planId } = useParams({ from: '/plan/$planId' });
  const { data: plan, isLoading, error } = usePlan(planId);
  const createItem = useCreateItem(planId);
  const [showItemForm, setShowItemForm] = useState(false);

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

  const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

  const itemsByCategory = CATEGORIES.map((category) => ({
    category,
    items: plan.items.filter((item) => item.category === category),
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
                />
              ))}
            </div>
          )}

          {showItemForm ? (
            <ItemForm
              onSubmit={handleAddItem}
              onCancel={() => setShowItemForm(false)}
              isSubmitting={createItem.isPending}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowItemForm(true)}
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
