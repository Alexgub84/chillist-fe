import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';

const profileSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
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

function CompleteProfileForm({
  user,
}: {
  user: { user_metadata: Record<string, unknown> };
}) {
  const navigate = useNavigate();
  const metadata = user.user_metadata;
  const { first, last } = splitFullName(metadata.full_name as string);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: (metadata.first_name as string) ?? first,
      lastName: (metadata.last_name as string) ?? last,
      phone: (metadata.phone as string) ?? '',
    },
  });

  async function onSubmit(values: ProfileForm) {
    const data: Record<string, string> = {};
    if (values.firstName) data.first_name = values.firstName;
    if (values.lastName) data.last_name = values.lastName;
    if (values.phone) data.phone = values.phone;

    if (Object.keys(data).length === 0) {
      navigate({ to: '/plans' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ data });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Profile updated');
    navigate({ to: '/plans' });
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Complete your profile
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Add your details so your trip buddies know who you are. All fields are
          optional.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First name
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
              Last name
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
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="+1 234 567 890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link
            to="/plans"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </Link>
        </p>
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/complete-profile')({
  component: CompleteProfile,
});
