import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';
import { useTranslation } from 'react-i18next';

import {
  planStatusSchema,
  planVisibilitySchema,
  type PlanCreateWithOwner,
} from '../core/schemas/plan';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';
import { useLanguage } from '../contexts/useLanguage';
import { useAuth } from '../contexts/useAuth';
import {
  combinePhone,
  detectCountryFromPhone,
  getDefaultCountryByLanguage,
} from '../data/country-codes';
import { PhoneInput } from './PhoneInput';
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

const participantRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneCountry: z.string().optional(),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().optional(),
});

const createPlanFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: planStatusSchema,
    visibility: planVisibilitySchema,
    ownerName: z.string().min(1, 'Owner name is required'),
    ownerLastName: z.string().min(1, 'Owner last name is required'),
    ownerPhoneCountry: z.string().optional(),
    ownerPhone: z.string().min(1, 'Owner phone is required'),
    ownerEmail: z.string().optional(),
    tagsCsv: z.string().optional(),
    participants: z.array(participantRowSchema).optional(),
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
  })
  .refine((data) => data.oneDay || !!data.endDateDate, {
    message: 'End date is required',
    path: ['endDateDate'],
  });

type FormValues = z.infer<typeof createPlanFormSchema>;

export type PlanFormPayload = PlanCreateWithOwner;

export interface DefaultOwner {
  ownerName?: string;
  ownerLastName?: string;
  ownerPhoneCountry?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

interface PlanFormProps {
  onSubmit: (payload: PlanFormPayload) => void | Promise<void>;
  isSubmitting?: boolean;
  defaultOwner?: DefaultOwner;
}

function resolveOwnerPhone(
  defaultOwner: DefaultOwner | undefined,
  lang: string
): { country: string; local: string } {
  const langDefault = getDefaultCountryByLanguage(lang);
  if (!defaultOwner?.ownerPhone) {
    return {
      country: defaultOwner?.ownerPhoneCountry ?? langDefault,
      local: '',
    };
  }
  if (defaultOwner.ownerPhoneCountry) {
    return {
      country: defaultOwner.ownerPhoneCountry,
      local: defaultOwner.ownerPhone,
    };
  }
  const detected = detectCountryFromPhone(defaultOwner.ownerPhone);
  if (detected)
    return { country: detected.countryCode, local: detected.localNumber };
  return { country: langDefault, local: defaultOwner.ownerPhone };
}

export default function PlanForm({
  onSubmit,
  isSubmitting = false,
  defaultOwner,
}: PlanFormProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const ownerPhone = resolveOwnerPhone(defaultOwner, language);
  const defaultPhoneCountry = getDefaultCountryByLanguage(language);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(createPlanFormSchema),
    defaultValues: {
      status: 'draft',
      visibility: isAuthenticated ? 'private' : 'public',
      oneDay: false,
      participants: [],
      ownerName: defaultOwner?.ownerName ?? '',
      ownerLastName: defaultOwner?.ownerLastName ?? '',
      ownerPhoneCountry: ownerPhone.country,
      ownerPhone: ownerPhone.local,
      ownerEmail: defaultOwner?.ownerEmail ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  const oneDay = watch('oneDay');
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

  useEffect(() => {
    const subscription = watch((values, { name }) => {
      if (name !== 'startDateTime' && name !== 'startDateDate') return;
      if (values.oneDay) return;
      if (
        !values.startDateDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(values.startDateDate)
      )
        return;
      if (!values.startDateTime || !/^\d{2}:\d{2}$/.test(values.startDateTime))
        return;
      if (values.endDateDate) return;

      const [year, month, day] = values.startDateDate.split('-').map(Number);
      const d = new Date(year, month - 1, day + 1);
      const endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setValue('endDateDate', endDate);
      setValue('endDateTime', values.startDateTime);
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

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
    const participants = (values.participants ?? [])
      .filter(
        (p) => p.name.trim() || p.lastName.trim() || p.contactPhone.trim()
      )
      .map((p) => ({
        name: p.name.trim(),
        lastName: p.lastName.trim(),
        contactPhone: combinePhone(p.phoneCountry, p.contactPhone),
        contactEmail: p.contactEmail?.trim() || undefined,
      }));

    const payload: PlanCreateWithOwner = {
      title: values.title,
      description: values.description || undefined,
      visibility: values.visibility,
      owner: {
        name: values.ownerName.trim(),
        lastName: values.ownerLastName.trim(),
        contactPhone: combinePhone(values.ownerPhoneCountry, values.ownerPhone),
        contactEmail: values.ownerEmail?.trim() || undefined,
      },
      participants: participants.length > 0 ? participants : undefined,
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
            locationId: generateLocationId(
              values.location!.name || values.title
            ),
            name: values.location!.name || values.title,
          }
        : undefined,
    };

    await onSubmit(payload);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 space-y-6"
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
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <FormLabel>{t('planForm.status')}</FormLabel>
            <FormSelect {...register('status')}>
              <option value="draft">{t('planStatus.draft')}</option>
              <option value="active">{t('planStatus.active')}</option>
              <option value="archived">{t('planStatus.archived')}</option>
            </FormSelect>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">
                {errors.status.message}
              </p>
            )}
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
            {t('planForm.ownerLegend')}
          </legend>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel>{t('planForm.firstName')}</FormLabel>
                <FormInput
                  {...register('ownerName')}
                  placeholder={t('planForm.firstNamePlaceholder')}
                  compact
                />
                {errors.ownerName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>{t('planForm.lastName')}</FormLabel>
                <FormInput
                  {...register('ownerLastName')}
                  placeholder={t('planForm.lastNamePlaceholder')}
                  compact
                />
                {errors.ownerLastName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.ownerLastName.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <FormLabel>{t('planForm.phone')}</FormLabel>
              <PhoneInput
                countryProps={register('ownerPhoneCountry')}
                phoneProps={register('ownerPhone')}
                countrySelectAriaLabel={t('planForm.phoneCountry')}
                phoneCountryDefaultLabel={t('planForm.phoneCountryDefault')}
                phonePlaceholder={t('planForm.phonePlaceholder')}
                compact
                error={errors.ownerPhone?.message}
              />
            </div>
            <div>
              <FormLabel>{t('planForm.email')}</FormLabel>
              <FormInput
                {...register('ownerEmail')}
                placeholder={t('planForm.emailPlaceholder')}
                compact
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-4 sm:p-5">
          <legend className="text-sm font-semibold text-gray-700 px-2 mb-3">
            {t('planForm.participantsLegend')}
          </legend>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {t('planForm.participantIndex', { index: index + 1 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    {t('planForm.remove')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FormInput
                      {...register(`participants.${index}.name`)}
                      placeholder={t('planForm.firstNamePlaceholder')}
                      compact
                    />
                    {errors.participants?.[index]?.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.participants[index].name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      {...register(`participants.${index}.lastName`)}
                      placeholder={t('planForm.lastNamePlaceholder')}
                      compact
                    />
                    {errors.participants?.[index]?.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.participants[index].lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <PhoneInput
                    countryProps={register(
                      `participants.${index}.phoneCountry`
                    )}
                    phoneProps={register(`participants.${index}.contactPhone`)}
                    countrySelectAriaLabel={t('planForm.phoneCountry')}
                    phoneCountryDefaultLabel={t('planForm.phoneCountryDefault')}
                    phonePlaceholder={t('planForm.phonePlaceholder')}
                    compact
                    hasLabel={false}
                    error={errors.participants?.[index]?.contactPhone?.message}
                  />
                </div>
                <div>
                  <FormInput
                    {...register(`participants.${index}.contactEmail`)}
                    placeholder={t('planForm.emailPlaceholder')}
                    compact
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({
                  name: '',
                  lastName: '',
                  phoneCountry: defaultPhoneCountry,
                  contactPhone: '',
                  contactEmail: '',
                })
              }
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              {t('planForm.addParticipant')}
            </button>
          </div>
        </fieldset>

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
              id="oneDay"
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="oneDay"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {t('planForm.oneDay')}
            </label>
          </div>

          {oneDay ? (
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
                <FormInput
                  type="time"
                  {...register('singleStartTime')}
                  compact
                />
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
                {errors.endDateDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.endDateDate.message}
                  </p>
                )}
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

        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          >
            {isSubmitting ? t('planForm.submitting') : t('planForm.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
