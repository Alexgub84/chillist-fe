import { useTranslation } from 'react-i18next';
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FormInput } from './FormInput';
import { PhoneInput } from '../PhoneInput';

export interface ProfileFieldValues {
  firstName: string;
  lastName: string;
  phoneCountry: string;
  phone: string;
  email: string;
}

interface ProfileFieldsProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  compact?: boolean;
}

export default function ProfileFields<T extends FieldValues>({
  register,
  errors,
  watch,
  setValue,
  compact,
}: ProfileFieldsProps<T>) {
  const { t } = useTranslation();
  const field = (name: keyof ProfileFieldValues) => name as Path<T>;
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-firstName" className={labelClass}>
            {t('profile.firstName')}
          </label>
          <FormInput
            id="pf-firstName"
            autoComplete="given-name"
            {...register(field('firstName'))}
            compact={compact}
          />
          {errors[field('firstName')] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[field('firstName')]?.message as string}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="pf-lastName" className={labelClass}>
            {t('profile.lastName')}
          </label>
          <FormInput
            id="pf-lastName"
            autoComplete="family-name"
            {...register(field('lastName'))}
            compact={compact}
          />
          {errors[field('lastName')] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[field('lastName')]?.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="pf-phone" className={labelClass}>
          {t('profile.phone')}
        </label>
        <PhoneInput
          countryValue={(watch(field('phoneCountry')) as string) ?? ''}
          onCountryChange={(code) =>
            setValue(field('phoneCountry'), code as PathValue<T, Path<T>>)
          }
          phoneProps={{ ...register(field('phone')), id: 'pf-phone' }}
          countrySelectAriaLabel={t('profile.phoneCountry')}
          phonePlaceholder={t('profile.phonePlaceholder')}
          compact={compact}
          error={errors[field('phone')]?.message as string | undefined}
        />
      </div>

      <div>
        <label htmlFor="pf-email" className={labelClass}>
          {t('profile.email')}
        </label>
        <FormInput
          id="pf-email"
          type="email"
          autoComplete="email"
          {...register(field('email'))}
          compact={compact}
        />
        {errors[field('email')] && (
          <p className="mt-1 text-xs text-red-600">
            {errors[field('email')]?.message as string}
          </p>
        )}
      </div>
    </>
  );
}
