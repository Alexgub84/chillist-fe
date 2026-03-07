import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import Modal from './shared/Modal';
import { useLanguage } from '../contexts/useLanguage';
import { usePlanContext } from '../hooks/usePlanContext';
import type { ItemCategory } from '../core/schemas/item';
import type { ItemCreate } from '../core/schemas/item';
import {
  EQUIPMENT_SUBCATEGORIES,
  FOOD_SUBCATEGORIES,
} from '../data/subcategories';
import {
  getCommonItems,
  type CommonItemBase,
} from '../data/common-items-registry';
import { calculateSuggestedQuantity } from '../core/utils-plan-points';

interface SelectedItem {
  name: string;
  category: ItemCategory;
  subcategory: string;
  unit: string;
  quantity: number;
  isCustom?: boolean;
}

type Step = 'category' | 'subcategory' | 'items';

interface BulkItemAddWizardProps {
  open: boolean;
  onClose: () => void;
  onAdd: (items: ItemCreate[]) => Promise<void>;
  existingItems?: Map<string, string>;
  onCancel?: (itemIds: string[]) => Promise<void>;
  planPoints?: number;
}

export default function BulkItemAddWizard({
  open,
  onClose,
  onAdd,
  existingItems,
  onCancel,
  planPoints,
}: BulkItemAddWizardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const planCtx = usePlanContext();
  const planLanguage = planCtx?.planLanguage ?? language;

  const defaultQuantity = useCallback(
    (item: CommonItemBase): number => {
      if (!planPoints || item.category !== 'food' || !item.quantityPerPoint)
        return 1;
      return calculateSuggestedQuantity({
        planPoints,
        quantityPerPoint: item.quantityPerPoint,
        isPersonal: item.isPersonal,
      });
    },
    [planPoints]
  );

  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(
    new Map()
  );
  const [uncheckedExisting, setUncheckedExisting] = useState<Set<string>>(
    new Set()
  );
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setStep('category');
    setCategory(null);
    setSubcategory(null);
    setSelected(new Map());
    setUncheckedExisting(new Set());
    setSearch('');
    setIsSubmitting(false);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  const items = useMemo(() => getCommonItems(planLanguage), [planLanguage]);

  const subcategories = useMemo(() => {
    if (!category) return [];
    const taxonomy =
      category === 'equipment' ? EQUIPMENT_SUBCATEGORIES : FOOD_SUBCATEGORIES;
    const countMap = new Map<string, number>();
    for (const item of items) {
      if (item.category === category && item.subcategory) {
        countMap.set(
          item.subcategory,
          (countMap.get(item.subcategory) ?? 0) + 1
        );
      }
    }
    return taxonomy
      .filter((sub) => (countMap.get(sub) ?? 0) > 0)
      .map((sub) => ({ name: sub, count: countMap.get(sub) ?? 0 }));
  }, [category, items]);

  const subcategoryItems = useMemo(() => {
    if (!category || !subcategory) return [];
    return items.filter(
      (item) => item.category === category && item.subcategory === subcategory
    );
  }, [category, subcategory, items]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return subcategoryItems;
    const q = search.toLowerCase();
    return subcategoryItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [subcategoryItems, search]);

  const getExistingItemId = useCallback(
    (name: string): string | undefined =>
      existingItems?.get(name.toLowerCase()),
    [existingItems]
  );

  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every(
      (item) =>
        selected.has(item.name) ||
        (getExistingItemId(item.name) !== undefined &&
          !uncheckedExisting.has(getExistingItemId(item.name)!))
    );
  }, [filteredItems, selected, getExistingItemId, uncheckedExisting]);

  useEffect(() => {
    if (step !== 'items' || !category || !subcategory || !existingItems?.size)
      return;
    setSelected((prev) => {
      const next = new Map(prev);
      for (const item of subcategoryItems) {
        const itemId = existingItems.get(item.name.toLowerCase());
        if (itemId && !uncheckedExisting.has(itemId) && !next.has(item.name)) {
          next.set(item.name, {
            name: item.name,
            category: item.category,
            subcategory: subcategory,
            unit: item.unit,
            quantity: defaultQuantity(item),
          });
        }
      }
      return next;
    });
  }, [
    step,
    category,
    subcategory,
    existingItems,
    subcategoryItems,
    uncheckedExisting,
    defaultQuantity,
  ]);

  const toggleItem = useCallback(
    (item: CommonItemBase) => {
      const qty = defaultQuantity(item);
      const itemId = getExistingItemId(item.name);
      if (itemId) {
        setUncheckedExisting((prev) => {
          const next = new Set(prev);
          if (next.has(itemId)) {
            next.delete(itemId);
            setSelected((s) => {
              const m = new Map(s);
              m.set(item.name, {
                name: item.name,
                category: item.category,
                subcategory: subcategory ?? '',
                unit: item.unit,
                quantity: qty,
              });
              return m;
            });
          } else {
            next.add(itemId);
            setSelected((s) => {
              const m = new Map(s);
              m.delete(item.name);
              return m;
            });
          }
          return next;
        });
      } else {
        setSelected((prev) => {
          const next = new Map(prev);
          if (next.has(item.name)) {
            next.delete(item.name);
          } else {
            next.set(item.name, {
              name: item.name,
              category: item.category,
              subcategory: subcategory ?? '',
              unit: item.unit,
              quantity: qty,
            });
          }
          return next;
        });
      }
    },
    [subcategory, getExistingItemId, defaultQuantity]
  );

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setUncheckedExisting((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) {
          const itemId = getExistingItemId(item.name);
          if (itemId) next.add(itemId);
        }
        return next;
      });
      setSelected((prev) => {
        const next = new Map(prev);
        for (const item of filteredItems) next.delete(item.name);
        return next;
      });
    } else {
      setUncheckedExisting((prev) => {
        const next = new Set(prev);
        for (const item of filteredItems) {
          const itemId = getExistingItemId(item.name);
          if (itemId) next.delete(itemId);
        }
        return next;
      });
      setSelected((prev) => {
        const next = new Map(prev);
        for (const item of filteredItems) {
          if (!next.has(item.name)) {
            next.set(item.name, {
              name: item.name,
              category: item.category,
              subcategory: subcategory ?? '',
              unit: item.unit,
              quantity: defaultQuantity(item),
            });
          }
        }
        return next;
      });
    }
  }

  function updateQuantity(name: string, delta: number) {
    setSelected((prev) => {
      const entry = prev.get(name);
      if (!entry) return prev;
      const newQty = Math.max(1, entry.quantity + delta);
      const next = new Map(prev);
      next.set(name, { ...entry, quantity: newQty });
      return next;
    });
  }

  function addCustomItem() {
    const trimmed = search.trim();
    if (!trimmed || !category || !subcategory) return;
    if (selected.has(trimmed)) return;
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(trimmed, {
        name: trimmed,
        category,
        subcategory,
        unit: category === 'equipment' ? 'pcs' : 'pcs',
        quantity: 1,
        isCustom: true,
      });
      return next;
    });
    setSearch('');
  }

  const newItemsToAdd = useMemo(
    () =>
      Array.from(selected.values()).filter(
        (s) => !existingItems?.has(s.name.toLowerCase())
      ),
    [selected, existingItems]
  );

  const hasWork =
    newItemsToAdd.length > 0 || (uncheckedExisting.size > 0 && !!onCancel);

  async function handleSubmit() {
    if (!hasWork) return;
    setIsSubmitting(true);

    try {
      if (newItemsToAdd.length > 0) {
        const payloads: ItemCreate[] = newItemsToAdd.map((s) => ({
          name: s.name,
          category: s.category,
          quantity: s.quantity,
          unit: s.unit as ItemCreate['unit'],
          subcategory: s.subcategory || null,
          notes: null,
        }));
        await onAdd(payloads);
      }
      if (uncheckedExisting.size > 0 && onCancel) {
        await onCancel(Array.from(uncheckedExisting));
      }
      setStep('subcategory');
      setSubcategory(null);
      setSearch('');
      setSelected(new Map());
      setUncheckedExisting(new Set());
    } catch {
      // keep state for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedCount =
    newItemsToAdd.length + (onCancel ? uncheckedExisting.size : 0);

  const modalTitle =
    step === 'category'
      ? t('items.bulkAddTitle')
      : step === 'subcategory'
        ? t('items.bulkAddPickSubcategory')
        : subcategory
          ? t(`subcategories.${subcategory}`, subcategory)
          : t('items.bulkAddSelectItems');

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      testId="bulk-item-add-wizard"
      showCloseButton
    >
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        {step === 'category' && (
          <CategoryStep
            onSelect={(cat) => {
              setCategory(cat);
              setStep('subcategory');
            }}
          />
        )}

        {step === 'subcategory' && category && (
          <SubcategoryStep
            subcategories={subcategories}
            onSelect={(sub) => {
              setSubcategory(sub);
              setStep('items');
            }}
            onBack={() => {
              setStep('category');
              setCategory(null);
            }}
          />
        )}

        {step === 'items' && (
          <ItemsStep
            filteredItems={filteredItems}
            subcategoryItems={subcategoryItems}
            selected={selected}
            allFilteredSelected={allFilteredSelected}
            search={search}
            selectedCount={selectedCount}
            hasWork={hasWork}
            isSubmitting={isSubmitting}
            getExistingItemId={getExistingItemId}
            uncheckedExisting={uncheckedExisting}
            onSearchChange={setSearch}
            onAddCustom={addCustomItem}
            onToggleItem={toggleItem}
            onToggleSelectAll={toggleSelectAll}
            onUpdateQuantity={updateQuantity}
            onSubmit={handleSubmit}
            onBack={() => {
              setStep('subcategory');
              setSubcategory(null);
              setSearch('');
            }}
          />
        )}
      </div>
    </Modal>
  );
}

function CategoryStep({ onSelect }: { onSelect: (cat: ItemCategory) => void }) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {t('items.bulkAddPickCategory')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-testid="bulk-cat-equipment"
          onClick={() => onSelect('equipment')}
          className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-800">
            {t('categories.equipment')}
          </span>
        </button>
        <button
          type="button"
          data-testid="bulk-cat-food"
          onClick={() => onSelect('food')}
          className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
        >
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-800">
            {t('categories.food')}
          </span>
        </button>
      </div>
    </div>
  );
}

function SubcategoryStep({
  subcategories,
  onSelect,
  onBack,
}: {
  subcategories: { name: string; count: number }[];
  onSelect: (sub: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3 cursor-pointer"
      >
        <svg
          className="w-4 h-4 rtl:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t('items.bulkAddBack')}
      </button>
      <div className="max-h-80 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="space-y-1.5">
          {subcategories.map((sub) => (
            <button
              key={sub.name}
              type="button"
              data-testid={`bulk-subcat-${sub.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelect(sub.name)}
              className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-start cursor-pointer"
            >
              <span className="text-sm font-medium text-gray-800">
                {t(`subcategories.${sub.name}`, sub.name)}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {t('items.bulkAddItemCount', { count: sub.count })}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemsStep({
  filteredItems,
  subcategoryItems,
  selected,
  allFilteredSelected,
  search,
  selectedCount,
  hasWork,
  isSubmitting,
  getExistingItemId,
  uncheckedExisting,
  onSearchChange,
  onAddCustom,
  onToggleItem,
  onToggleSelectAll,
  onUpdateQuantity,
  onSubmit,
  onBack,
}: {
  filteredItems: CommonItemBase[];
  subcategoryItems: CommonItemBase[];
  selected: Map<string, SelectedItem>;
  allFilteredSelected: boolean;
  search: string;
  selectedCount: number;
  hasWork: boolean;
  isSubmitting: boolean;
  getExistingItemId: (name: string) => string | undefined;
  uncheckedExisting: Set<string>;
  onSearchChange: (v: string) => void;
  onAddCustom: () => void;
  onToggleItem: (item: CommonItemBase) => void;
  onToggleSelectAll: () => void;
  onUpdateQuantity: (name: string, delta: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3 cursor-pointer"
      >
        <svg
          className="w-4 h-4 rtl:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t('items.bulkAddBack')}
      </button>

      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAddCustom();
          }
        }}
        placeholder={t('items.bulkAddSearch')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
      />

      {filteredItems.length > 0 && (
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2 text-start cursor-pointer"
        >
          {allFilteredSelected
            ? t('items.bulkAddDeselectAll')
            : t('items.bulkAddSelectAll')}
        </button>
      )}

      <div className="max-h-64 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6 mb-3">
        <div className="space-y-1.5">
          {filteredItems.map((item) => {
            const existingItemId = getExistingItemId(item.name);
            const entry = selected.get(item.name);
            const isChecked =
              !!entry ||
              (existingItemId !== undefined &&
                !uncheckedExisting.has(existingItemId));
            const isNewItem = !existingItemId;
            return (
              <div
                key={item.name}
                role="button"
                data-testid={`bulk-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                tabIndex={0}
                onClick={() => onToggleItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleItem(item);
                  }
                }}
                className={clsx(
                  'flex items-center gap-2 py-2 px-3 rounded-lg border text-start cursor-pointer transition-colors',
                  isChecked
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                )}
              >
                <span
                  className={clsx(
                    'text-sm font-medium flex-1 min-w-0',
                    isChecked ? 'text-blue-800' : 'text-gray-800'
                  )}
                >
                  {item.name}
                </span>
                {isChecked && isNewItem && entry && (
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.name, -1);
                      }}
                      disabled={entry.quantity <= 1}
                      className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="text-xs font-medium text-blue-800 w-5 text-center">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.name, 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {Array.from(selected.values())
            .filter((s) => s.isCustom)
            .map((s) => (
              <div
                key={s.name}
                role="button"
                tabIndex={0}
                data-testid={`bulk-item-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() =>
                  onToggleItem({
                    name: s.name,
                    category: s.category,
                    subcategory: s.subcategory,
                    unit: s.unit,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleItem({
                      name: s.name,
                      category: s.category,
                      subcategory: s.subcategory,
                      unit: s.unit,
                    });
                  }
                }}
                className="flex items-center gap-2 py-2 px-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-start cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-blue-800 flex-1 min-w-0 italic">
                  {s.name}
                </span>
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(s.name, -1);
                    }}
                    disabled={s.quantity <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="text-xs font-medium text-blue-800 w-5 text-center">
                    {s.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(s.name, 1);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>

        {(() => {
          const trimmed = search.trim();
          const matchesCommon =
            trimmed &&
            subcategoryItems.some(
              (item) => item.name.toLowerCase() === trimmed.toLowerCase()
            );
          const matchesSelectedCustom =
            trimmed && selected.has(trimmed) && selected.get(trimmed)?.isCustom;
          const showAddCustom =
            trimmed && !matchesCommon && !matchesSelectedCustom;
          if (!showAddCustom) return null;
          return (
            <div className="space-y-0.5 pt-1">
              <button
                type="button"
                onClick={onAddCustom}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-blue-50 text-blue-600 text-sm font-medium text-start cursor-pointer"
                data-testid="bulk-add-custom-row"
              >
                <span className="shrink-0">+</span>
                <span className="truncate">
                  {t('items.bulkAddAddCustom', { name: trimmed })}
                </span>
              </button>
            </div>
          );
        })()}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasWork || isSubmitting}
        className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isSubmitting
          ? t('items.bulkAddAdding')
          : selectedCount === 0
            ? t('items.bulkAddNoneSelected')
            : selectedCount === 1
              ? t('items.bulkAddConfirmOne')
              : t('items.bulkAddConfirm', { count: selectedCount })}
      </button>
    </div>
  );
}
