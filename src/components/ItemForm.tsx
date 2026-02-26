import { useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import {
  itemCategorySchema,
  itemStatusSchema,
  unitSchema,
  type ItemCategory,
  type Unit,
} from '../core/schemas/item';
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  UNIT_GROUPS,
} from '../core/constants/item';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import Autocomplete from './shared/Autocomplete';
import { useLanguage } from '../contexts/useLanguage';
import commonItemsEn from '../data/common-items.json';
import commonItemsHe from '../data/common-items.he.json';

type CommonItemEn = {
  id: string;
  name: string;
  category: ItemCategory;
  subcategory?: string;
  unit: Unit;
  aliases: string[];
  tags: string[];
};

type CommonItemHe = {
  name: string;
  category: ItemCategory;
  subcategory?: string;
  unit: Unit;
};

const EN_ITEMS: CommonItemEn[] = commonItemsEn as CommonItemEn[];
const HE_ITEMS: CommonItemHe[] = commonItemsHe as CommonItemHe[];

import type { Participant } from '../core/schemas/participant';

const itemFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: itemCategorySchema,
  subcategory: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit: unitSchema,
  status: itemStatusSchema,
  notes: z.string().optional(),
  assignedParticipantId: z.string().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

const ITEM_FORM_DEFAULTS: ItemFormValues = {
  name: '',
  category: 'food',
  subcategory: undefined,
  quantity: 1,
  unit: 'kg',
  status: 'pending',
  notes: '',
  assignedParticipantId: '',
};

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>;
  participants?: Participant[];
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function ItemForm({
  defaultValues,
  participants = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
}: ItemFormProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

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

  const category = watch('category');
  const isEquipment = category === 'equipment';

  const itemNames = useMemo(
    () =>
      language === 'he'
        ? HE_ITEMS.map((i) => i.name)
        : EN_ITEMS.map((i) => i.name),
    [language]
  );

  const itemLookup = useMemo(() => {
    const map = new Map<
      string,
      { category: ItemCategory; unit: Unit; subcategory?: string }
    >();
    if (language === 'he') {
      for (const item of HE_ITEMS) {
        map.set(item.name.toLowerCase(), {
          category: item.category,
          unit: item.unit,
          subcategory: item.subcategory,
        });
      }
    } else {
      for (const item of EN_ITEMS) {
        const entry = {
          category: item.category,
          unit: item.unit,
          subcategory: item.subcategory,
        };
        map.set(item.name.toLowerCase(), entry);
        for (const alias of item.aliases) {
          map.set(alias.toLowerCase(), entry);
        }
      }
    }
    return map;
  }, [language]);

  const searchIndex = useMemo(() => {
    const map = new Map<string, string[]>();
    if (language === 'he') {
      for (const item of HE_ITEMS) {
        map.set(item.name, [item.name.toLowerCase()]);
      }
    } else {
      for (const item of EN_ITEMS) {
        const terms = [
          item.name.toLowerCase(),
          ...item.aliases.map((a) => a.toLowerCase()),
          ...item.tags.map((tag) => tag.toLowerCase()),
        ];
        map.set(item.name, terms);
      }
    }
    return map;
  }, [language]);

  const filterFn = useCallback(
    (itemName: string, query: string) => {
      const terms = searchIndex.get(itemName);
      if (!terms) return false;
      const q = query.toLowerCase();
      return terms.some((term) => term.includes(q));
    },
    [searchIndex]
  );

  function handleItemSelect(name: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(name);
    const match = itemLookup.get(name.toLowerCase());
    if (match) {
      setValue('category', match.category);
      setValue('unit', match.unit);
      if (match.subcategory) {
        setValue('subcategory', match.subcategory);
      }
    }
  }

  useEffect(() => {
    if (isEquipment) {
      setValue('unit', 'pcs');
    }
  }, [isEquipment, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
      <div>
        <FormLabel>{t('items.name')}</FormLabel>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Autocomplete
              items={itemNames}
              value={field.value}
              onChange={field.onChange}
              onSelect={(name) => handleItemSelect(name, field.onChange)}
              filterFn={filterFn}
              placeholder={t('items.namePlaceholder')}
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
          <FormLabel>{t('items.category')}</FormLabel>
          <FormSelect {...register('category')} compact>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
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
          <FormLabel>{t('items.status')}</FormLabel>
          <FormSelect {...register('status')} compact>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
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
          <FormLabel>{t('items.quantity')}</FormLabel>
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
          <FormLabel>{t('items.unit')}</FormLabel>
          <FormSelect {...register('unit')} disabled={isEquipment} compact>
            {isEquipment ? (
              <option value="pcs">{t('units.pcs')}</option>
            ) : (
              UNIT_GROUPS.map((group) => (
                <optgroup
                  key={group.groupLabelKey}
                  label={t(group.groupLabelKey)}
                >
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </FormSelect>
        </div>
      </div>

      <div>
        <FormLabel>{t('items.notes')}</FormLabel>
        <FormTextarea
          {...register('notes')}
          placeholder={t('items.notesPlaceholder')}
          rows={2}
        />
      </div>

      {participants.length > 0 && (
        <div>
          <FormLabel>{t('items.assignTo')}</FormLabel>
          <FormSelect {...register('assignedParticipantId')} compact>
            <option value="">{t('items.unassigned')}</option>
            {participants.map((p) => (
              <option key={p.participantId} value={p.participantId}>
                {p.name} {p.lastName}
              </option>
            ))}
          </FormSelect>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? t('items.saving')
            : (submitLabel ?? t('items.addItemLabel'))}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {t('items.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
