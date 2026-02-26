import {
  createLazyFileRoute,
  Link,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { claimInvite } from '../core/api';
import { getPendingInvite, clearPendingInvite } from '../core/pending-invite';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { redirect } = useSearch({ from: '/signup' });
  const redirectTo = redirect || '/plans';
  const [confirmationSent, setConfirmationSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(values: SignUpForm) {
    try {
      console.info(
        `[SignUp] Attempting email sign-up for "${values.email}", redirectTo="${redirectTo}".`
      );
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error(
          `[SignUp] Email sign-up failed for "${values.email}". Error: ${error.message} (status: ${error.status})`
        );
        toast.error(error.message);
        return;
      }

      if (data.session) {
        const pending = getPendingInvite();
        if (pending) {
          console.info(
            `[SignUp] Pending invite found — planId="${pending.planId}", token="${pending.inviteToken.slice(0, 8)}…". Claiming before navigation…`
          );
          clearPendingInvite();
          try {
            await claimInvite(pending.planId, pending.inviteToken);
          } catch (claimErr) {
            console.warn(
              `[SignUp] claimInvite failed — planId="${pending.planId}". User may not see the plan immediately. ` +
                `Error: ${claimErr instanceof Error ? claimErr.message : String(claimErr)}`
            );
            toast.error(t('invite.claimFailed'));
          }
          queryClient.invalidateQueries();
        }

        console.info(
          `[SignUp] Sign-up succeeded with immediate session for "${values.email}". Navigating to "${redirectTo}".`
        );
        navigate({ to: redirectTo });
      } else {
        console.info(
          `[SignUp] Confirmation email sent for "${values.email}". Awaiting verification.`
        );
        setConfirmationSent(true);
      }
    } catch (err) {
      console.error(
        `[SignUp] Unexpected error during email sign-up. Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    }
  }

  async function handleGoogleSignUp() {
    try {
      console.info(
        `[SignUp] Initiating Google OAuth, redirectTo="${redirectTo}".`
      );
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });

      if (error) {
        console.error(
          `[SignUp] Google OAuth failed. Error: ${error.message} (status: ${error.status})`
        );
        toast.error(error.message);
        return;
      }

      if (!data.url) {
        console.info(
          '[SignUp] Google OAuth returned no URL — navigating locally.'
        );
        navigate({ to: redirectTo });
      }
    } catch (err) {
      console.error(
        `[SignUp] Unexpected error during Google OAuth. Error: ${err instanceof Error ? err.message : String(err)}`
      );
      toast.error(t('errors.somethingWentWrong'));
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('signUp.confirmTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('signUp.confirmMessage')}
            </p>
            <Link
              to="/signin"
              className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t('signUp.goToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('signUp.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{t('signUp.subtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('signUp.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={t('signUp.emailPlaceholder')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t('signUp.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder={t('signUp.passwordPlaceholder')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('signUp.submitting') : t('signUp.submit')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                {t('signUp.or')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('signUp.google')}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('signUp.hasAccount')}{' '}
          <Link
            to="/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('signUp.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/signup')({
  component: SignUp,
});
