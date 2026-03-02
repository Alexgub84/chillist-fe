import { useTranslation } from 'react-i18next';
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form';
import { FormLabel } from './FormLabel';
import { FormInput, FormTextarea } from './FormInput';

export interface PreferencesFieldValues {
  adultsCount?: number;
  kidsCount?: number;
  foodPreferences?: string;
  allergies?: string;
  notes?: string;
}

interface PreferencesFieldsProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  compact?: boolean;
}

export default function PreferencesFields<T extends FieldValues>({
  register,
  errors,
  compact,
}: PreferencesFieldsProps<T>) {
  const { t } = useTranslation();
  const field = (name: keyof PreferencesFieldValues) => name as Path<T>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormLabel>{t('preferences.adultsCount')}</FormLabel>
          <FormInput
            type="number"
            min={1}
            {...register(field('adultsCount'))}
            placeholder={t('preferences.adultsCountPlaceholder')}
            compact={compact}
          />
          {errors[field('adultsCount')] && (
            <p className="text-sm text-red-600 mt-1">
              {errors[field('adultsCount')]?.message as string}
            </p>
          )}
        </div>
        <div>
          <FormLabel>{t('preferences.kidsCount')}</FormLabel>
          <FormInput
            type="number"
            min={0}
            {...register(field('kidsCount'))}
            placeholder={t('preferences.kidsCountPlaceholder')}
            compact={compact}
          />
          {errors[field('kidsCount')] && (
            <p className="text-sm text-red-600 mt-1">
              {errors[field('kidsCount')]?.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <FormLabel>{t('preferences.foodPreferences')}</FormLabel>
        <FormTextarea
          rows={2}
          {...register(field('foodPreferences'))}
          placeholder={t('preferences.foodPreferencesPlaceholder')}
        />
      </div>

      <div>
        <FormLabel>{t('preferences.allergies')}</FormLabel>
        <FormTextarea
          rows={2}
          {...register(field('allergies'))}
          placeholder={t('preferences.allergiesPlaceholder')}
        />
      </div>

      <div>
        <FormLabel>{t('preferences.notes')}</FormLabel>
        <FormTextarea
          rows={2}
          {...register(field('notes'))}
          placeholder={t('preferences.notesPlaceholder')}
        />
      </div>
    </>
  );
}
