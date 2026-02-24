import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';
import { useTranslation } from 'react-i18next';

import {
  planStatusSchema,
  planVisibilitySchema,
  type PlanWithDetails,
  type PlanPatch,
} from '../core/schemas/plan';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import { useAuth } from '../contexts/useAuth';
import LocationAutocomplete from './LocationAutocomplete';
import type { PlaceResult } from './LocationAutocomplete';

const locationFormSchema = z
  .object({
    name: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
  })
  .optional();

const editPlanFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: planStatusSchema,
    visibility: planVisibilitySchema,
    tagsCsv: z.string().optional(),
    oneDay: z.boolean().optional(),
    singleDate: z
      .string()
      .min(1, 'Date is required')
      .optional()
      .or(z.literal('')),
    singleStartTime: z.string().optional(),
    singleEndTime: z.string().optional(),
    startDateDate: z
      .string()
      .min(1, 'Start date is required')
      .optional()
      .or(z.literal('')),
    startDateTime: z.string().optional(),
    endDateDate: z.string().optional(),
    endDateTime: z.string().optional(),
    location: locationFormSchema,
  })
  .refine((data) => !data.oneDay || !!data.singleDate, {
    message: 'Date is required',
    path: ['singleDate'],
  })
  .refine((data) => data.oneDay || !!data.startDateDate, {
    message: 'Start date is required',
    path: ['startDateDate'],
  });

type FormValues = z.infer<typeof editPlanFormSchema>;

interface EditPlanFormProps {
  plan: PlanWithDetails;
  onSubmit: (updates: PlanPatch) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function parseISODate(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function parseISOTime(iso?: string | null): string {
  if (!iso) return '';
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

function isSameDate(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return false;
  return start.slice(0, 10) === end.slice(0, 10);
}

export default function EditPlanForm({
  plan,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditPlanFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const oneDay = isSameDate(plan.startDate, plan.endDate);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(editPlanFormSchema),
    defaultValues: {
      title: plan.title,
      description: plan.description ?? '',
      status: plan.status,
      visibility: plan.visibility,
      tagsCsv: plan.tags?.join(', ') ?? '',
      oneDay,
      singleDate: oneDay ? parseISODate(plan.startDate) : '',
      singleStartTime: oneDay ? parseISOTime(plan.startDate) : '',
      singleEndTime: oneDay ? parseISOTime(plan.endDate) : '',
      startDateDate: oneDay ? '' : parseISODate(plan.startDate),
      startDateTime: oneDay ? '' : parseISOTime(plan.startDate),
      endDateDate: oneDay ? '' : parseISODate(plan.endDate),
      endDateTime: oneDay ? '' : parseISOTime(plan.endDate),
      location: plan.location
        ? {
            name: plan.location.name ?? '',
            city: plan.location.city ?? '',
            country: plan.location.country ?? '',
            region: plan.location.region ?? '',
            latitude: plan.location.latitude,
            longitude: plan.location.longitude,
          }
        : undefined,
    },
  });

  const oneDayWatch = watch('oneDay');
  const locationData = watch('location');
  const locationNameRef = useRef<HTMLInputElement | null>(null);
  const { ref: locationNameFormRef, ...locationNameRest } = register(
    'location.name' as const
  );

  function handlePlaceSelect(place: PlaceResult) {
    setValue('location', {
      ...locationData,
      name: place.name,
      city: place.city || '',
      country: place.country || '',
      region: place.region || '',
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }

  const parseTags = (csv?: string) =>
    csv
      ? csv
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

  const makeDateTime = (date?: string, time?: string) => {
    if (!date) return undefined;
    const hhmm = time || '00:00';
    return `${date}T${hhmm}:00Z`;
  };

  const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const generateLocationId = (name: string) => {
    return uuidv5(name, UUID_NAMESPACE);
  };

  const hasLocationData = (loc?: {
    name?: string;
    city?: string;
    country?: string;
    region?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    if (!loc) return false;
    return (
      [loc.name, loc.city, loc.country, loc.region].some(
        (v) => v && v.trim().length > 0
      ) ||
      (loc.latitude != null && loc.longitude != null)
    );
  };

  async function handleFormSubmit(values: FormValues): Promise<void> {
    const updates: PlanPatch = {
      title: values.title,
      description: values.description || null,
      status: values.status,
      visibility: values.visibility,
      startDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleStartTime)
        : makeDateTime(values.startDateDate, values.startDateTime),
      endDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleEndTime)
        : makeDateTime(values.endDateDate, values.endDateTime),
      tags: parseTags(values.tagsCsv),
      location: hasLocationData(values.location)
        ? {
            ...values.location,
            locationId:
              plan.location?.locationId ??
              generateLocationId(values.location!.name || values.title),
            name: values.location!.name || values.title,
          }
        : null,
    };

    await onSubmit(updates);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-5"
    >
      <div>
        <FormLabel>{t('planForm.title')}</FormLabel>
        <FormInput
          {...register('title')}
          placeholder={t('planForm.titlePlaceholder')}
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <FormLabel>{t('planForm.description')}</FormLabel>
        <FormTextarea
          {...register('description')}
          placeholder={t('planForm.descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FormLabel>{t('planForm.status')}</FormLabel>
          <FormSelect {...register('status')}>
            <option value="draft">{t('planStatus.draft')}</option>
            <option value="active">{t('planStatus.active')}</option>
            <option value="archived">{t('planStatus.archived')}</option>
          </FormSelect>
        </div>

        <div>
          <FormLabel>{t('planForm.visibility')}</FormLabel>
          <FormSelect {...register('visibility')}>
            {isAuthenticated ? (
              <>
                <option value="private">{t('planVisibility.private')}</option>
                <option value="invite_only">
                  {t('planVisibility.invite_only')}
                </option>
              </>
            ) : (
              <option value="public">{t('planVisibility.public')}</option>
            )}
          </FormSelect>
        </div>
      </div>

      <fieldset className="border border-gray-200 rounded-lg p-4 sm:p-5">
        <legend className="text-sm font-semibold text-gray-700 px-2 mb-3">
          {t('planForm.locationLegend')}
        </legend>
        <div className="space-y-4">
          <div className="relative">
            <FormLabel>{t('planForm.locationName')}</FormLabel>
            <FormInput
              {...locationNameRest}
              ref={(el) => {
                locationNameFormRef(el);
                locationNameRef.current = el;
              }}
              placeholder={t('planForm.locationNamePlaceholder')}
              compact
              autoComplete="off"
            />
            <LocationAutocomplete
              onPlaceSelect={handlePlaceSelect}
              latitude={locationData?.latitude}
              longitude={locationData?.longitude}
              inputRef={locationNameRef}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel>{t('planForm.city')}</FormLabel>
              <FormInput
                {...register('location.city' as const)}
                placeholder={t('planForm.cityPlaceholder')}
                compact
              />
            </div>
            <div>
              <FormLabel>{t('planForm.country')}</FormLabel>
              <FormInput
                {...register('location.country' as const)}
                placeholder={t('planForm.countryPlaceholder')}
                compact
              />
            </div>
          </div>
          <div>
            <FormLabel>{t('planForm.region')}</FormLabel>
            <FormInput
              {...register('location.region' as const)}
              placeholder={t('planForm.regionPlaceholder')}
              compact
            />
          </div>
        </div>
      </fieldset>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register('oneDay')}
            id="editOneDay"
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="editOneDay"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {t('planForm.oneDay')}
          </label>
        </div>

        {oneDayWatch ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
            <div>
              <FormLabel>{t('planForm.date')}</FormLabel>
              <FormInput type="date" {...register('singleDate')} compact />
              {errors.singleDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.singleDate.message}
                </p>
              )}
            </div>
            <div>
              <FormLabel>{t('planForm.startTime')}</FormLabel>
              <FormInput type="time" {...register('singleStartTime')} compact />
            </div>
            <div>
              <FormLabel>{t('planForm.endTime')}</FormLabel>
              <FormInput type="time" {...register('singleEndTime')} compact />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
            <div>
              <FormLabel>{t('planForm.startDate')}</FormLabel>
              <FormInput type="date" {...register('startDateDate')} compact />
              {errors.startDateDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.startDateDate.message}
                </p>
              )}
            </div>
            <div>
              <FormLabel>{t('planForm.startTime')}</FormLabel>
              <FormInput type="time" {...register('startDateTime')} compact />
            </div>
            <div>
              <FormLabel>{t('planForm.endDate')}</FormLabel>
              <FormInput type="date" {...register('endDateDate')} compact />
            </div>
            <div>
              <FormLabel>{t('planForm.endTime')}</FormLabel>
              <FormInput type="time" {...register('endDateTime')} compact />
            </div>
          </div>
        )}
      </div>

      <div>
        <FormLabel>{t('planForm.tags')}</FormLabel>
        <FormInput
          {...register('tagsCsv')}
          placeholder={t('planForm.tagsPlaceholder')}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium"
        >
          {t('items.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('planForm.updating') : t('planForm.update')}
        </button>
      </div>
    </form>
  );
}
