import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import {
  splitFullName,
  parseExistingPhone,
  updateUserProfile,
} from '../core/profile-utils';
import ProfileFields from '../components/shared/ProfileFields';

const profileSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phoneCountry: z.string().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(255).optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

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
    watch,
    setValue,
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
    const result = await updateUserProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      phoneCountry: values.phoneCountry,
      phone: values.phone,
      currentEmail,
      newEmail: values.email,
    });

    if (!result.success) {
      toast.error(result.error ?? t('profile.updateFailed'));
      return;
    }

    if (result.emailChanged) {
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
          <ProfileFields
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />

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
