import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import type { User } from '@supabase/supabase-js';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import PreferencesFields from './shared/PreferencesFields';
import LocationAutocomplete from './LocationAutocomplete';
import type { PlaceResult } from './LocationAutocomplete';
import BulkItemAddWizard from './BulkItemAddWizard';
import {
  DEFAULT_PLAN_LANGUAGE,
  DEFAULT_PLAN_CURRENCY,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  LANGUAGE_META,
} from '../contexts/language-context';
import { combinePhone } from '../data/country-codes';
import { splitFullName } from '../core/profile-utils';
import { useCreatePlan } from '../hooks/useCreatePlan';
import { useUpdateParticipant } from '../hooks/useUpdateParticipant';
import { useCreateItem } from '../hooks/useCreateItem';
import { getApiErrorMessage } from '../core/error-utils';
import type {
  PlanCreateWithOwner,
  PlanWithDetails,
} from '../core/schemas/plan';
import type { ItemCreate } from '../core/schemas/item';

type WizardStep = 1 | 2 | 3;

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

const step1Schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  defaultLang: z.string().max(10).optional(),
  currency: z.string().max(10).optional(),
  oneDay: z.boolean().optional(),
  singleDate: z.string().optional().or(z.literal('')),
  singleStartTime: z.string().optional(),
  singleEndTime: z.string().optional(),
  startDateDate: z.string().optional().or(z.literal('')),
  startDateTime: z.string().optional(),
  endDateDate: z.string().optional(),
  endDateTime: z.string().optional(),
  location: locationFormSchema,
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

type Step2Values = {
  adultsCount?: number;
  kidsCount?: number;
  foodPreferences?: string;
  allergies?: string;
  notes?: string;
  estimatedAdults?: number;
  estimatedKids?: number;
};

interface CreatePlanWizardProps {
  user: User | null;
}

function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: WizardStep;
  completedSteps: Set<number>;
}) {
  const { t } = useTranslation();
  const steps = [
    { num: 1, label: t('wizard.step1Title') },
    { num: 2, label: t('wizard.step2Title') },
    { num: 3, label: t('wizard.step3Title') },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                step.num === currentStep && 'bg-blue-600 text-white',
                completedSteps.has(step.num) &&
                  step.num !== currentStep &&
                  'bg-green-500 text-white',
                !completedSteps.has(step.num) &&
                  step.num !== currentStep &&
                  'bg-gray-200 text-gray-500'
              )}
            >
              {completedSteps.has(step.num) && step.num !== currentStep ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.num
              )}
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
            <div
              className={clsx(
                'w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 mb-5',
                completedSteps.has(step.num) ? 'bg-green-400' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function getCurrentHour00(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:00`;
}

function isDateToday(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const selected = new Date(y, m - 1, d);
  const today = new Date();
  return (
    selected.getFullYear() === today.getFullYear() &&
    selected.getMonth() === today.getMonth() &&
    selected.getDate() === today.getDate()
  );
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

export default function CreatePlanWizard({ user }: CreatePlanWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [createdPlan, setCreatedPlan] = useState<PlanWithDetails | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createPlan = useCreatePlan();
  const updateParticipant = useUpdateParticipant(createdPlan?.planId ?? '');
  const createItem = useCreateItem(createdPlan?.planId ?? '');

  function navigateToPlan() {
    if (createdPlan?.planId) {
      navigate({ to: '/plan/$planId', params: { planId: createdPlan.planId } });
    } else {
      navigate({ to: '/plans' });
    }
  }

  function handleStep1Submit(values: Step1Values) {
    setStep1Data(values);
    setCompletedSteps((prev) => new Set([...prev, 1]));
    setStep(2);
  }

  async function handleStep2Submit(values: Step2Values) {
    if (!step1Data || !user) return;
    setIsCreating(true);

    try {
      const meta = user.user_metadata ?? {};
      const { first, last } = splitFullName(meta.full_name as string);
      const ownerName = (meta.first_name as string) || first || 'Owner';
      const ownerLastName = (meta.last_name as string) || last || '';
      const ownerPhone = (meta.phone as string) || '';
      const ownerEmail = user.email ?? '';

      const payload: PlanCreateWithOwner = {
        title: step1Data.title,
        description: step1Data.description || undefined,
        visibility: 'invite_only',
        owner: {
          name: ownerName.trim(),
          lastName: ownerLastName.trim() || ownerName.trim(),
          contactPhone: combinePhone(undefined, ownerPhone) || '+0000000000',
          contactEmail: ownerEmail.trim() || undefined,
        },
        startDate: step1Data.oneDay
          ? makeDateTime(step1Data.singleDate, step1Data.singleStartTime)
          : makeDateTime(step1Data.startDateDate, step1Data.startDateTime),
        endDate: step1Data.oneDay
          ? makeDateTime(step1Data.singleDate, step1Data.singleEndTime)
          : makeDateTime(step1Data.endDateDate, step1Data.endDateTime),
        defaultLang: step1Data.defaultLang ?? DEFAULT_PLAN_LANGUAGE,
        currency: step1Data.currency ?? DEFAULT_PLAN_CURRENCY,
        location: hasLocationData(step1Data.location)
          ? {
              ...step1Data.location,
              locationId: uuidv5(
                step1Data.location!.name || step1Data.title,
                UUID_NAMESPACE
              ),
              name: step1Data.location!.name || step1Data.title,
            }
          : undefined,
        estimatedAdults: values.estimatedAdults ?? undefined,
        estimatedKids: values.estimatedKids ?? undefined,
      };

      const created = await createPlan.mutateAsync(payload);
      if (!created?.planId) {
        navigate({ to: '/plans' });
        return;
      }

      setCreatedPlan(created);

      const ownerId = created.participants.find(
        (p) => p.role === 'owner'
      )?.participantId;

      if (ownerId) {
        try {
          await updateParticipant.mutateAsync({
            participantId: ownerId,
            updates: {
              rsvpStatus: 'confirmed',
              adultsCount: values.adultsCount ?? null,
              kidsCount: values.kidsCount ?? null,
              foodPreferences: values.foodPreferences || null,
              allergies: values.allergies || null,
              notes: values.notes || null,
            },
          });
        } catch (err) {
          const { title, message } = getApiErrorMessage(
            err instanceof Error ? err : new Error(String(err))
          );
          console.error(
            `[CreatePlanWizard] Failed to update owner preferences: ${title}: ${message}`
          );
        }
      }

      setCompletedSteps((prev) => new Set([...prev, 2]));
      setStep(3);
    } catch (err) {
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleBulkItemsAdd(items: ItemCreate[]) {
    const results = await Promise.allSettled(
      items.map((item) => createItem.mutateAsync(item))
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed === 0) {
      toast.success(t('items.bulkAddSuccess', { count: succeeded }));
    } else if (succeeded > 0) {
      toast.error(
        t('items.bulkAddPartial', {
          successCount: succeeded,
          errorCount: failed,
        })
      );
    } else {
      toast.error(t('items.bulkAddError'));
    }
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
        <StepIndicator currentStep={step} completedSteps={completedSteps} />

        {step === 1 && (
          <Step1Form onSubmit={handleStep1Submit} defaultValues={step1Data} />
        )}

        {step === 2 && (
          <Step2Form
            onSubmit={handleStep2Submit}
            onBack={() => setStep(1)}
            isCreating={isCreating}
          />
        )}

        {step === 3 && createdPlan && (
          <Step3Items
            onAdd={handleBulkItemsAdd}
            onSkip={navigateToPlan}
            onDone={navigateToPlan}
          />
        )}
      </div>
    </div>
  );
}

function Step1Form({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: Step1Values) => void;
  defaultValues: Step1Values | null;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaultValues ?? {
      oneDay: false,
      defaultLang: DEFAULT_PLAN_LANGUAGE,
      currency: DEFAULT_PLAN_CURRENCY,
    },
  });

  const oneDay = watch('oneDay');
  const locationData = watch('location');
  const locationNameRef = useRef<HTMLInputElement | null>(null);
  const singleStartTimeRef = useRef<HTMLInputElement | null>(null);
  const startDateTimeRef = useRef<HTMLInputElement | null>(null);
  const endDateDateRef = useRef<HTMLInputElement | null>(null);
  const endDateTimeRef = useRef<HTMLInputElement | null>(null);
  const skipEndDateShowPickerRef = useRef(false);
  const skipStartTimeChainRef = useRef(false);

  function openPicker(inputRef: { current: HTMLInputElement | null }) {
    setTimeout(() => {
      if (!inputRef.current) return;
      try {
        inputRef.current.dataset.pickerOpenedMs = String(Date.now());
        inputRef.current.showPicker?.();
      } catch {
        /* showPicker may throw outside user-gesture contexts */
      }
    }, 50);
  }

  function handleStartTimeBlur() {
    const val = startDateTimeRef.current?.value;
    if (!val || !/^\d{2}:\d{2}$/.test(val)) return;
    openPicker(endDateDateRef);
  }

  const { ref: locationNameFormRef, ...locationNameRest } = register(
    'location.name' as const
  );
  const { ref: singleStartRef, ...singleStartRest } =
    register('singleStartTime');
  const { ref: startDateTimeFormRef, ...startDateTimeRest } =
    register('startDateTime');
  const { ref: endDateDateFormRef, ...endDateDateRest } =
    register('endDateDate');
  const { ref: endDateTimeFormRef, ...endDateTimeRest } =
    register('endDateTime');

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

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name === 'singleDate' && values.oneDay) {
        if (
          values.singleDate &&
          /^\d{4}-\d{2}-\d{2}$/.test(values.singleDate)
        ) {
          const startTime = isDateToday(values.singleDate)
            ? getCurrentHour00()
            : '08:00';
          setValue('singleStartTime', startTime);
          setValue('singleEndTime', startTime);
          openPicker(singleStartTimeRef);
        }
        return;
      }
      if (name === 'singleStartTime' && values.oneDay) {
        if (
          values.singleStartTime &&
          /^\d{2}:\d{2}$/.test(values.singleStartTime)
        ) {
          setValue('singleEndTime', values.singleStartTime);
        }
        return;
      }
      if (name === 'endDateDate' && !values.oneDay) {
        if (skipEndDateShowPickerRef.current) {
          skipEndDateShowPickerRef.current = false;
          return;
        }
        if (
          values.endDateDate &&
          /^\d{4}-\d{2}-\d{2}$/.test(values.endDateDate)
        ) {
          const endTime = isDateToday(values.endDateDate)
            ? getCurrentHour00()
            : '08:00';
          setValue('endDateTime', endTime);
          openPicker(endDateTimeRef);
        }
        return;
      }
      if (name !== 'startDateDate' && name !== 'startDateTime') return;
      if (values.oneDay) return;
      if (
        !values.startDateDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(values.startDateDate)
      )
        return;
      let startTime = values.startDateTime;
      if (name === 'startDateDate') {
        startTime = isDateToday(values.startDateDate)
          ? getCurrentHour00()
          : '08:00';
        skipStartTimeChainRef.current = true;
        setValue('startDateTime', startTime);
        skipEndDateShowPickerRef.current = true;
        setValue(
          'endDateDate',
          (() => {
            const [y, m, d] = values.startDateDate!.split('-').map(Number);
            const end = new Date(y, m - 1, d + 1);
            return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
          })()
        );
        setValue('endDateTime', startTime);
        openPicker(startDateTimeRef);
        return;
      }
      if (skipStartTimeChainRef.current) {
        skipStartTimeChainRef.current = false;
        return;
      }
      if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return;
      setValue('endDateTime', startTime);
      const [year, month, day] = values.startDateDate.split('-').map(Number);
      const d = new Date(year, month - 1, day + 1);
      const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      skipEndDateShowPickerRef.current = true;
      setValue('endDateDate', endDate);
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      data-testid="wizard-step1"
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
            id="wizardOneDay"
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="wizardOneDay"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {t('planForm.oneDay')}
          </label>
        </div>

        {oneDay ? (
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
              <FormInput
                type="time"
                {...singleStartRest}
                ref={(el) => {
                  singleStartRef(el);
                  singleStartTimeRef.current = el;
                }}
                compact
              />
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
              <FormInput
                type="time"
                {...startDateTimeRest}
                ref={(el) => {
                  startDateTimeFormRef(el);
                  startDateTimeRef.current = el;
                }}
                onBlur={(e) => {
                  startDateTimeRest.onBlur(e);
                  handleStartTimeBlur();
                }}
                compact
              />
            </div>
            <div>
              <FormLabel>{t('planForm.endDate')}</FormLabel>
              <FormInput
                type="date"
                {...endDateDateRest}
                ref={(el) => {
                  endDateDateFormRef(el);
                  endDateDateRef.current = el;
                }}
                compact
              />
              {errors.endDateDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.endDateDate.message}
                </p>
              )}
            </div>
            <div>
              <FormLabel>{t('planForm.endTime')}</FormLabel>
              <FormInput
                type="time"
                {...endDateTimeRest}
                ref={(el) => {
                  endDateTimeFormRef(el);
                  endDateTimeRef.current = el;
                }}
                compact
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="pt-4">
        <button
          type="submit"
          className="w-full px-4 py-3 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md"
        >
          {t('wizard.next')}
        </button>
      </div>
    </form>
  );
}

function Step2Form({
  onSubmit,
  onBack,
  isCreating,
}: {
  onSubmit: (values: Step2Values) => void;
  onBack: () => void;
  isCreating: boolean;
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
      adultsCount: 1,
      kidsCount: undefined,
      foodPreferences: '',
      allergies: '',
      notes: '',
      estimatedAdults: undefined,
      estimatedKids: undefined,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      data-testid="wizard-step2"
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
          disabled={isCreating}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
        >
          {t('wizard.back')}
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className="flex-1 px-4 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isCreating ? t('wizard.creating') : t('wizard.next')}
        </button>
      </div>
    </form>
  );
}

function Step3Items({
  onAdd,
  onSkip,
  onDone,
}: {
  onAdd: (items: ItemCreate[]) => Promise<void>;
  onSkip: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div data-testid="wizard-step3">
      <BulkItemAddWizard open={true} onClose={onDone} onAdd={onAdd} inline />
      <div className="mt-4">
        <button
          type="button"
          onClick={onSkip}
          className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
          data-testid="wizard-skip-items"
        >
          {t('wizard.skipItems')}
        </button>
      </div>
    </div>
  );
}
