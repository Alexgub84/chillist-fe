import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea } from './shared/FormInput';

export type PreferencesFormValues = {
  rsvpStatus?: 'confirmed' | 'not_sure' | null;
  adultsCount?: number;
  kidsCount?: number;
  foodPreferences?: string;
  allergies?: string;
  notes?: string;
};

function buildPreferencesSchema(t: (key: string) => string) {
  return z.object({
    rsvpStatus: z.enum(['confirmed', 'not_sure']).nullish(),
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
  });
}

interface PreferencesFormProps {
  defaultValues?: Partial<PreferencesFormValues>;
  onSubmit: (values: PreferencesFormValues) => void | Promise<void>;
  onSkip?: () => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  inModal?: boolean;
  showRsvp?: boolean;
}

export default function PreferencesForm({
  defaultValues,
  onSubmit,
  onSkip,
  onCancel,
  isSubmitting,
  inModal,
  showRsvp,
}: PreferencesFormProps) {
  const { t } = useTranslation();
  const schema = buildPreferencesSchema(t);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PreferencesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rsvpStatus: defaultValues?.rsvpStatus ?? undefined,
      adultsCount: defaultValues?.adultsCount ?? 1,
      kidsCount: defaultValues?.kidsCount ?? undefined,
      foodPreferences: defaultValues?.foodPreferences ?? '',
      allergies: defaultValues?.allergies ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const rsvpValue = watch('rsvpStatus');
  const padding = inModal ? 'px-4 sm:px-6 pb-4 sm:pb-6' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={padding}>
      <p className="text-sm text-gray-500 mb-4">{t('preferences.subtitle')}</p>

      <div className="space-y-4">
        {showRsvp && (
          <div>
            <FormLabel>{t('preferences.rsvpLabel')}</FormLabel>
            <div className="flex gap-2 mt-1">
              <label
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors',
                  rsvpValue === 'confirmed'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <input
                  type="radio"
                  value="confirmed"
                  {...register('rsvpStatus')}
                  className="sr-only"
                />
                {t('rsvpStatus.confirmed')}
              </label>
              <label
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors',
                  rsvpValue === 'not_sure'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <input
                  type="radio"
                  value="not_sure"
                  {...register('rsvpStatus')}
                  className="sr-only"
                />
                {t('rsvpStatus.not_sure')}
              </label>
            </div>
            {errors.rsvpStatus && (
              <p className="text-sm text-red-600 mt-1">
                {errors.rsvpStatus.message}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>{t('preferences.adultsCount')}</FormLabel>
            <FormInput
              type="number"
              min={1}
              {...register('adultsCount')}
              placeholder={t('preferences.adultsCountPlaceholder')}
              compact
            />
            {errors.adultsCount && (
              <p className="text-sm text-red-600 mt-1">
                {errors.adultsCount.message}
              </p>
            )}
          </div>
          <div>
            <FormLabel>{t('preferences.kidsCount')}</FormLabel>
            <FormInput
              type="number"
              min={0}
              {...register('kidsCount')}
              placeholder={t('preferences.kidsCountPlaceholder')}
              compact
            />
            {errors.kidsCount && (
              <p className="text-sm text-red-600 mt-1">
                {errors.kidsCount.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <FormLabel>{t('preferences.foodPreferences')}</FormLabel>
          <FormTextarea
            rows={2}
            {...register('foodPreferences')}
            placeholder={t('preferences.foodPreferencesPlaceholder')}
          />
        </div>

        <div>
          <FormLabel>{t('preferences.allergies')}</FormLabel>
          <FormTextarea
            rows={2}
            {...register('allergies')}
            placeholder={t('preferences.allergiesPlaceholder')}
          />
        </div>

        <div>
          <FormLabel>{t('preferences.notes')}</FormLabel>
          <FormTextarea
            rows={2}
            {...register('notes')}
            placeholder={t('preferences.notesPlaceholder')}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSubmitting ? t('preferences.saving') : t('preferences.submit')}
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            {t('preferences.skip')}
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            {t('addParticipant.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
