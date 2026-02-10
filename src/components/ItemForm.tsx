import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  itemCategorySchema,
  itemStatusSchema,
  unitSchema,
  type ItemCategory,
  type Unit,
} from '../core/schemas/item';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import Autocomplete from './shared/Autocomplete';
import commonItemsData from '../data/common-items.json';

type CommonItem = { name: string; category: ItemCategory; unit: Unit };
const COMMON_ITEMS: CommonItem[] = commonItemsData as CommonItem[];

const itemFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: itemCategorySchema,
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit: unitSchema,
  status: itemStatusSchema,
  notes: z.string().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

const ITEM_FORM_DEFAULTS: ItemFormValues = {
  name: '',
  category: 'food',
  quantity: 1,
  unit: 'kg',
  status: 'pending',
  notes: '',
};

const CATEGORY_OPTIONS: {
  value: z.infer<typeof itemCategorySchema>;
  label: string;
}[] = [
  { value: 'food', label: 'Food' },
  { value: 'equipment', label: 'Equipment' },
];

const STATUS_OPTIONS: {
  value: z.infer<typeof itemStatusSchema>;
  label: string;
}[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'packed', label: 'Packed' },
  { value: 'canceled', label: 'Canceled' },
];

const UNIT_OPTIONS: { value: z.infer<typeof unitSchema>; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'pcs', label: 'pcs' },
  { value: 'pack', label: 'pack' },
  { value: 'set', label: 'set' },
];

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>;
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function ItemForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Add Item',
}: ItemFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: { ...ITEM_FORM_DEFAULTS, ...defaultValues },
  });

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const category = watch('category');
  const isEquipment = category === 'equipment';

  const itemNames = useMemo(() => COMMON_ITEMS.map((i) => i.name), []);
  const itemLookup = useMemo(() => {
    const map = new Map<string, CommonItem>();
    for (const item of COMMON_ITEMS) {
      map.set(item.name.toLowerCase(), item);
    }
    return map;
  }, []);

  function handleItemSelect(name: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(name);
    const match = itemLookup.get(name.toLowerCase());
    if (match) {
      setValue('category', match.category);
      setValue('unit', match.unit);
    }
  }

  useEffect(() => {
    if (isEquipment) {
      setValue('unit', 'pcs');
    }
  }, [isEquipment, setValue]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4"
    >
      <div>
        <FormLabel>Name *</FormLabel>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Autocomplete
              items={itemNames}
              value={field.value}
              onChange={field.onChange}
              onSelect={(name) => handleItemSelect(name, field.onChange)}
              placeholder="Item name"
              compact
            />
          )}
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FormLabel>Category *</FormLabel>
          <FormSelect {...register('category')} compact>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
          {errors.category && (
            <p className="text-sm text-red-600 mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <FormLabel>Status *</FormLabel>
          <FormSelect {...register('status')} compact>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
          {errors.status && (
            <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FormLabel>Quantity *</FormLabel>
          <FormInput
            type="number"
            min={1}
            step={1}
            {...register('quantity')}
            compact
          />
          {errors.quantity && (
            <p className="text-sm text-red-600 mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>

        <div>
          <FormLabel>Unit</FormLabel>
          <FormSelect {...register('unit')} disabled={isEquipment} compact>
            {isEquipment ? (
              <option value="pcs">pcs</option>
            ) : (
              UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            )}
          </FormSelect>
        </div>
      </div>

      <div>
        <FormLabel>Notes</FormLabel>
        <FormTextarea
          {...register('notes')}
          placeholder="Optional notes"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
