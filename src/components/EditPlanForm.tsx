import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import {
  planStatusSchema,
  type PlanWithDetails,
  type PlanPatch,
} from '../core/schemas/plan';
import type { Participant } from '../core/schemas/participant';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  LANGUAGE_META,
  isSupportedLanguage,
  DEFAULT_PLAN_LANGUAGE,
  DEFAULT_PLAN_CURRENCY,
} from '../contexts/language-context';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import PreferencesFields from './shared/PreferencesFields';
import LocationAutocomplete from './LocationAutocomplete';
import type { PlaceResult } from './LocationAutocomplete';

type EditStep = 1 | 2;

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

const step1Schema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: planStatusSchema,
    defaultLang: z.string().max(10).optional(),
    currency: z.string().max(10).optional(),
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

type Step1Values = z.infer<typeof step1Schema>;

function buildStep2Schema(t: (key: string) => string) {
  return z.object({
    adultsCount: z.coerce
      .number({ invalid_type_error: t('validation.adultsCountInvalid') })
      .int()
      .min(1, t('validation.adultsCountMin'))
      .optional(),
    kidsCount: z.coerce
      .number({ invalid_type_error: t('validation.kidsCountInvalid') })
      .int()
      .min(0, t('validation.kidsCountMin'))
      .optional(),
    foodPreferences: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
    estimatedAdults: z.coerce
      .number({ invalid_type_error: t('validation.adultsCountInvalid') })
      .int()
      .min(0, t('validation.kidsCountMin'))
      .optional(),
    estimatedKids: z.coerce
      .number({ invalid_type_error: t('validation.kidsCountInvalid') })
      .int()
      .min(0, t('validation.kidsCountMin'))
      .optional(),
  });
}

type Step2Values = z.infer<ReturnType<typeof buildStep2Schema>>;

export interface EditPlanSubmitPayload {
  planPatch: PlanPatch;
  ownerPreferences: {
    adultsCount?: number | null;
    kidsCount?: number | null;
    foodPreferences?: string | null;
    allergies?: string | null;
    notes?: string | null;
  };
}

interface EditPlanFormProps {
  plan: PlanWithDetails;
  ownerParticipant?: Participant | null;
  onSubmit: (payload: EditPlanSubmitPayload) => void | Promise<void>;
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

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function makeDateTime(date?: string, time?: string) {
  if (!date) return undefined;
  const hhmm = time || '00:00';
  return `${date}T${hhmm}:00Z`;
}

function hasLocationData(loc?: {
  name?: string;
  city?: string;
  country?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  if (!loc) return false;
  return (
    [loc.name, loc.city, loc.country, loc.region].some(
      (v) => v && v.trim().length > 0
    ) ||
    (loc.latitude != null && loc.longitude != null)
  );
}

function EditStepIndicator({ currentStep }: { currentStep: EditStep }) {
  const { t } = useTranslation();
  const steps = [
    { num: 1, label: t('wizard.step1Title') },
    { num: 2, label: t('wizard.step2Title') },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-5">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                step.num === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {step.num}
            </div>
            <span
              className={clsx(
                'text-xs mt-1 font-medium',
                step.num === currentStep ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-12 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-5 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function EditPlanForm({
  plan,
  ownerParticipant,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditPlanFormProps) {
  const [step, setStep] = useState<EditStep>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);

  function handleStep1Next(values: Step1Values) {
    setStep1Data(values);
    setStep(2);
  }

  async function handleStep2Submit(values: Step2Values) {
    const s1 = step1Data;
    if (!s1) return;

    const parseTags = (csv?: string) =>
      csv
        ? csv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const planPatch: PlanPatch = {
      title: s1.title,
      description: s1.description || null,
      status: s1.status,
      defaultLang: s1.defaultLang ?? null,
      currency: s1.currency ?? null,
      startDate: s1.oneDay
        ? makeDateTime(s1.singleDate, s1.singleStartTime)
        : makeDateTime(s1.startDateDate, s1.startDateTime),
      endDate: s1.oneDay
        ? makeDateTime(s1.singleDate, s1.singleEndTime)
        : makeDateTime(s1.endDateDate, s1.endDateTime),
      tags: parseTags(s1.tagsCsv),
      location: hasLocationData(s1.location)
        ? {
            ...s1.location,
            locationId:
              plan.location?.locationId ??
              uuidv5(s1.location!.name || s1.title, UUID_NAMESPACE),
            name: s1.location!.name || s1.title,
          }
        : null,
      estimatedAdults: values.estimatedAdults ?? null,
      estimatedKids: values.estimatedKids ?? null,
    };

    await onSubmit({
      planPatch,
      ownerPreferences: {
        adultsCount: values.adultsCount ?? null,
        kidsCount: values.kidsCount ?? null,
        foodPreferences: values.foodPreferences || null,
        allergies: values.allergies || null,
        notes: values.notes || null,
      },
    });
  }

  return (
    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
      <EditStepIndicator currentStep={step} />

      {step === 1 && (
        <EditStep1Form
          plan={plan}
          defaultValues={step1Data}
          onNext={handleStep1Next}
          onCancel={onCancel}
        />
      )}

      {step === 2 && (
        <EditStep2Form
          plan={plan}
          ownerParticipant={ownerParticipant}
          onSubmit={handleStep2Submit}
          onBack={() => setStep(1)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

function EditStep1Form({
  plan,
  defaultValues,
  onNext,
  onCancel,
}: {
  plan: PlanWithDetails;
  defaultValues: Step1Values | null;
  onNext: (values: Step1Values) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const oneDay = isSameDate(plan.startDate, plan.endDate);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaultValues ?? {
      title: plan.title,
      description: plan.description ?? '',
      status: plan.status,
      defaultLang:
        plan.defaultLang && isSupportedLanguage(plan.defaultLang)
          ? plan.defaultLang
          : DEFAULT_PLAN_LANGUAGE,
      currency:
        plan.currency &&
        SUPPORTED_CURRENCIES.some((c) => c.code === plan.currency)
          ? plan.currency
          : DEFAULT_PLAN_CURRENCY,
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

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-5"
      data-testid="edit-wizard-step1"
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

      <div className="relative">
        <FormLabel>{t('planForm.locationLegend')}</FormLabel>
        <FormInput
          {...locationNameRest}
          ref={(el) => {
            locationNameFormRef(el);
            locationNameRef.current = el;
          }}
          placeholder={t('wizard.locationPlaceholder')}
          autoComplete="off"
        />
        <LocationAutocomplete
          onPlaceSelect={handlePlaceSelect}
          latitude={locationData?.latitude}
          longitude={locationData?.longitude}
          inputRef={locationNameRef}
        />
      </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="col-span-2 sm:col-span-1">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-blue-50 p-3 sm:p-4 rounded-lg">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <FormLabel>{t('planForm.status')}</FormLabel>
          <FormSelect {...register('status')}>
            <option value="active">{t('planStatus.active')}</option>
            <option value="draft">{t('planStatus.draft')}</option>
            <option value="archived">{t('planStatus.archived')}</option>
          </FormSelect>
        </div>
        <div>
          <FormLabel>{t('planForm.defaultLang')}</FormLabel>
          <FormSelect {...register('defaultLang')}>
            {SUPPORTED_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_META[code].nativeLabel}
              </option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FormLabel>{t('planForm.currency')}</FormLabel>
          <FormSelect {...register('currency')}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.label}
              </option>
            ))}
          </FormSelect>
        </div>
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
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm"
        >
          {t('items.cancel')}
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          {t('wizard.next')}
        </button>
      </div>
    </form>
  );
}

function EditStep2Form({
  plan,
  ownerParticipant,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  plan: PlanWithDetails;
  ownerParticipant?: Participant | null;
  onSubmit: (values: Step2Values) => void | Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildStep2Schema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      adultsCount: ownerParticipant?.adultsCount ?? 1,
      kidsCount: ownerParticipant?.kidsCount ?? undefined,
      foodPreferences: ownerParticipant?.foodPreferences ?? '',
      allergies: ownerParticipant?.allergies ?? '',
      notes: ownerParticipant?.notes ?? '',
      estimatedAdults: plan.estimatedAdults ?? undefined,
      estimatedKids: plan.estimatedKids ?? undefined,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      data-testid="edit-wizard-step2"
    >
      <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('preferences.ownerSectionTitle')}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('preferences.ownerSectionSubtitle')}
          </p>
        </div>

        <PreferencesFields register={register} errors={errors} compact />
      </section>

      <section className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('preferences.estimationSectionTitle')}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('preferences.estimationSectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>{t('preferences.estimatedAdults')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              {...register('estimatedAdults')}
              placeholder={t('preferences.estimatedAdultsPlaceholder')}
              compact
            />
            {errors.estimatedAdults && (
              <p className="text-sm text-red-600 mt-1">
                {errors.estimatedAdults.message}
              </p>
            )}
          </div>
          <div>
            <FormLabel>{t('preferences.estimatedKids')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              {...register('estimatedKids')}
              placeholder={t('preferences.estimatedKidsPlaceholder')}
              compact
            />
            {errors.estimatedKids && (
              <p className="text-sm text-red-600 mt-1">
                {errors.estimatedKids.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
        >
          {t('wizard.back')}
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
