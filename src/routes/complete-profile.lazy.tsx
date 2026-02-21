import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { supabase } from '../lib/supabase';
import {
  countryCodes,
  getFlagEmoji,
  getDialCode,
  detectCountryFromPhone,
  getDefaultCountryByLanguage,
} from '../data/country-codes';

const profileSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phoneCountry: z.string().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(255).optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

function splitFullName(fullName?: string): { first: string; last: string } {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' '),
  };
}

export function CompleteProfile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && !user) {
    navigate({ to: '/plans' });
    return null;
  }

  if (loading) {
    return null;
  }

  return <CompleteProfileForm user={user!} />;
}

function parseExistingPhone(
  rawPhone: string | undefined,
  lang: string
): { country: string; local: string } {
  if (!rawPhone)
    return { country: getDefaultCountryByLanguage(lang), local: '' };
  const detected = detectCountryFromPhone(rawPhone);
  if (detected)
    return { country: detected.countryCode, local: detected.localNumber };
  return { country: getDefaultCountryByLanguage(lang), local: rawPhone };
}

function CompleteProfileForm({
  user,
}: {
  user: { email?: string; user_metadata: Record<string, unknown> };
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const metadata = user.user_metadata;
  const { first, last } = splitFullName(metadata.full_name as string);
  const currentEmail = user.email ?? '';
  const existingPhone = parseExistingPhone(metadata.phone as string, language);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (metadata.first_name as string) ?? first,
      lastName: (metadata.last_name as string) ?? last,
      phoneCountry: existingPhone.country,
      phone: existingPhone.local,
      email: currentEmail,
    },
  });

  async function onSubmit(values: ProfileForm) {
    const data: Record<string, string> = {};
    if (values.firstName) data.first_name = values.firstName;
    if (values.lastName) data.last_name = values.lastName;

    if (values.phone) {
      const dialCode = getDialCode(values.phoneCountry ?? '');
      data.phone = dialCode ? `${dialCode}${values.phone}` : values.phone;
    }

    const emailChanged = !!values.email && values.email !== currentEmail;

    if (Object.keys(data).length === 0 && !emailChanged) {
      navigate({ to: '/plans' });
      return;
    }

    const updatePayload: { email?: string; data?: Record<string, string> } = {};
    if (emailChanged) updatePayload.email = values.email;
    if (Object.keys(data).length > 0) updatePayload.data = data;

    const { error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (emailChanged) {
      toast.success(t('profile.emailChanged'));
    } else {
      toast.success(t('profile.updated'));
    }
    navigate({ to: '/plans' });
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('profile.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t('profile.subtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              {t('profile.firstName')}
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register('firstName')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Alex"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              {t('profile.lastName')}
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register('lastName')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Guberman"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              {t('profile.phone')}
            </label>
            <div className="mt-1 flex gap-2">
              <select
                {...register('phoneCountry')}
                aria-label={t('profile.phoneCountry')}
                className="w-[140px] shrink-0 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">{t('profile.phoneCountryDefault')}</option>
                {countryCodes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {getFlagEmoji(c.code)} {c.dialCode}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                autoComplete="tel-national"
                {...register('phone')}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder={t('profile.phonePlaceholder')}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('profile.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={t('profile.emailPlaceholder')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('profile.saving') : t('profile.submit')}
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link
            to="/plans"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {t('profile.skip')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/complete-profile')({
  component: CompleteProfile,
});
