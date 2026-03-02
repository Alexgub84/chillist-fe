import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { ParticipantCreate } from '../core/schemas/participant';
import { FormLabel } from './shared/FormLabel';
import { FormInput } from './shared/FormInput';
import { PhoneInput } from './PhoneInput';
import {
  combinePhone,
  getDefaultCountryByLanguage,
} from '../data/country-codes';
import { useLanguage } from '../contexts/useLanguage';

const addParticipantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneCountry: z.string().optional().or(z.literal('')),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().optional(),
});

type AddParticipantFormValues = z.infer<typeof addParticipantSchema>;

interface AddParticipantFormProps {
  onSubmit: (values: ParticipantCreate) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AddParticipantForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: AddParticipantFormProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const defaultPhoneCountry = getDefaultCountryByLanguage(language);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddParticipantFormValues>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      name: '',
      lastName: '',
      phoneCountry: defaultPhoneCountry,
      contactPhone: '',
      contactEmail: '',
    },
  });

  async function handleFormSubmit(values: AddParticipantFormValues) {
    await onSubmit({
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      contactPhone: combinePhone(values.phoneCountry, values.contactPhone),
      contactEmail: values.contactEmail?.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FormLabel>{t('addParticipant.firstName')}</FormLabel>
          <FormInput
            {...register('name')}
            placeholder={t('addParticipant.firstNamePlaceholder')}
            compact
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <FormLabel>{t('addParticipant.lastName')}</FormLabel>
          <FormInput
            {...register('lastName')}
            placeholder={t('addParticipant.lastNamePlaceholder')}
            compact
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FormLabel>{t('addParticipant.phone')}</FormLabel>
          <PhoneInput
            countryValue={watch('phoneCountry') ?? ''}
            onCountryChange={(code) => setValue('phoneCountry', code)}
            phoneProps={register('contactPhone')}
            countrySelectAriaLabel={t('profile.phoneCountry')}
            phonePlaceholder={t('addParticipant.phonePlaceholder')}
            compact
            error={errors.contactPhone?.message}
          />
        </div>
        <div>
          <FormLabel>{t('addParticipant.email')}</FormLabel>
          <FormInput
            {...register('contactEmail')}
            placeholder={t('addParticipant.emailPlaceholder')}
            compact
          />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSubmitting
            ? t('addParticipant.submitting')
            : t('addParticipant.submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
        >
          {t('addParticipant.cancel')}
        </button>
      </div>
    </form>
  );
}
