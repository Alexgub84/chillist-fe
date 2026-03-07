import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { Participant } from '../core/schemas/participant';
import type { Item } from '../core/schemas/item';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormSelect } from './shared/FormInput';

const expenseFormSchema = z.object({
  participantId: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  itemIds: z.array(z.string()).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  participants: Participant[];
  items?: Item[];
  isOwner: boolean;
  currentParticipantId?: string;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  currency?: string;
}

export default function ExpenseForm({
  defaultValues,
  participants,
  items = [],
  isOwner,
  currentParticipantId,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  currency,
}: ExpenseFormProps) {
  const { t } = useTranslation();

  const resolvedDefaults: ExpenseFormValues = {
    participantId:
      defaultValues?.participantId ??
      (isOwner ? '' : (currentParticipantId ?? '')),
    amount: defaultValues?.amount ?? ('' as unknown as number),
    description: defaultValues?.description ?? '',
    itemIds: defaultValues?.itemIds ?? [],
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: resolvedDefaults,
  });

  const selectedItemIds = watch('itemIds') ?? [];
  const selectedParticipantId = watch('participantId');
  const canSelectParticipant = isOwner;

  const participantItems = useMemo(() => {
    if (!selectedParticipantId) return [];
    return items.filter(
      (item) =>
        item.isAllParticipants ||
        item.assignmentStatusList.some(
          (a) => a.participantId === selectedParticipantId
        )
    );
  }, [items, selectedParticipantId]);

  const prevParticipantIdRef = useRef(selectedParticipantId);
  useEffect(() => {
    if (prevParticipantIdRef.current !== selectedParticipantId) {
      prevParticipantIdRef.current = selectedParticipantId;
      setValue('itemIds', [], { shouldDirty: true });
    }
  }, [selectedParticipantId, setValue]);

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const cleaned = {
          ...values,
          itemIds: values.itemIds?.length ? values.itemIds : undefined,
        };
        return onSubmit(cleaned);
      })}
      className="p-4 sm:p-6 space-y-4"
    >
      {canSelectParticipant ? (
        <div>
          <FormLabel>{t('expenses.participant')} *</FormLabel>
          <FormSelect
            id="participantId"
            {...register('participantId')}
            aria-invalid={!!errors.participantId}
          >
            <option value="">{t('expenses.selectParticipant')}</option>
            {participants.map((p) => (
              <option key={p.participantId} value={p.participantId}>
                {p.name} {p.lastName}
              </option>
            ))}
          </FormSelect>
          {errors.participantId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.participantId.message}
            </p>
          )}
        </div>
      ) : (
        <input type="hidden" {...register('participantId')} />
      )}

      <div>
        <FormLabel>
          {t('expenses.amount')}
          {currency ? ` (${currency})` : ''} *
        </FormLabel>
        <FormInput
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder={t('expenses.amountPlaceholder')}
          {...register('amount')}
          aria-invalid={!!errors.amount}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <FormLabel>{t('expenses.description')}</FormLabel>
        <FormInput
          id="description"
          placeholder={t('expenses.descriptionPlaceholder')}
          {...register('description')}
        />
      </div>

      {participantItems.length > 0 ? (
        <ItemMultiSelect
          items={participantItems}
          selectedIds={selectedItemIds}
          onChange={(ids) => setValue('itemIds', ids, { shouldDirty: true })}
        />
      ) : (
        selectedParticipantId &&
        items.length > 0 && (
          <p className="text-sm text-gray-400 text-center py-2">
            {t('expenses.noItemsForParticipant')}
          </p>
        )
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('expenses.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="expense-form-submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? t('expenses.saving')
            : (submitLabel ?? t('expenses.addExpense'))}
        </button>
      </div>
    </form>
  );
}

function ItemMultiSelect({
  items,
  selectedIds,
  onChange,
}: {
  items: Item[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(selectedIds.length > 0);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Item[]>>();
    for (const item of filtered) {
      const category = item.category;
      const subcategory = item.subcategory ?? 'Other';
      if (!map.has(category)) map.set(category, new Map());
      const catMap = map.get(category)!;
      if (!catMap.has(subcategory)) catMap.set(subcategory, []);
      catMap.get(subcategory)!.push(item);
    }
    return map;
  }, [filtered]);

  function toggleItem(itemId: string) {
    const next = selectedIds.includes(itemId)
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];
    onChange(next);
  }

  function toggleSubcategory(subcatItems: Item[]) {
    const ids = subcatItems.map((i) => i.itemId);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !ids.includes(id)));
    } else {
      const merged = [...selectedIds];
      for (const id of ids) {
        if (!merged.includes(id)) merged.push(id);
      }
      onChange(merged);
    }
  }

  function getItemName(itemId: string): string {
    return items.find((i) => i.itemId === itemId)?.name ?? itemId.slice(0, 8);
  }

  return (
    <div>
      <button
        type="button"
        data-testid="toggle-item-select"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
      >
        <svg
          className={clsx(
            'w-3.5 h-3.5 transition-transform',
            open && 'rotate-90'
          )}
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
        {t('expenses.selectItems')}
        {selectedIds.length > 0 && (
          <span className="text-xs font-normal text-gray-500">
            ({t('expenses.itemsSelected', { count: selectedIds.length })})
          </span>
        )}
      </button>

      {open && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('expenses.searchItems')}
              data-testid="item-search-input"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-100">
              {selectedIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
                >
                  {getItemName(id)}
                  <button
                    type="button"
                    onClick={() => toggleItem(id)}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${getItemName(id)}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 p-3 text-center">
                {t('expenses.noItemsInPlan')}
              </p>
            )}
            {Array.from(grouped.entries()).map(([category, subcatMap]) => (
              <div key={category}>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                  {t(`items.${category}`)}
                </div>
                {Array.from(subcatMap.entries()).map(
                  ([subcategory, subcatItems]) => {
                    const subcatIds = subcatItems.map((i) => i.itemId);
                    const selectedCount = subcatIds.filter((id) =>
                      selectedIds.includes(id)
                    ).length;
                    const allSelected = selectedCount === subcatIds.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <div key={subcategory}>
                        <label
                          data-testid={`subcat-${subcategory}`}
                          className="flex items-center gap-3 px-3 py-1.5 bg-gray-50/60 cursor-pointer hover:bg-gray-100 transition-colors border-t border-gray-100"
                        >
                          <input
                            type="checkbox"
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            checked={allSelected}
                            onChange={() => toggleSubcategory(subcatItems)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-gray-600 truncate">
                            {t(`subcategories.${subcategory}`, subcategory)}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            ({subcatItems.length})
                          </span>
                        </label>
                        {subcatItems.map((item) => {
                          const checked = selectedIds.includes(item.itemId);
                          return (
                            <label
                              key={item.itemId}
                              className={clsx(
                                'flex items-center gap-3 ps-8 pe-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors',
                                checked && 'bg-blue-50/50'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleItem(item.itemId)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 truncate">
                                {item.name}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-400 shrink-0">
                                  ×{item.quantity}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    );
                  }
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
