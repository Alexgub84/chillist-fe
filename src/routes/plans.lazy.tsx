import { useEffect } from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { usePlans } from '../hooks/usePlans';
import { useAuth } from '../contexts/useAuth';
import { PlansList } from '../components/PlansList';
import { getApiErrorMessage } from '../core/error-utils';

export const Route = createLazyFileRoute('/plans')({
  component: Plans,
});

export function Plans() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { data: plans, isLoading, error, refetch } = usePlans(isAuthenticated);

  useEffect(() => {
    if (error) {
      console.error(
        `[Plans] Failed to fetch plans — "${error.message}". ` +
          `Name: ${error.name}, Stack: ${error.stack?.split('\n').slice(0, 3).join(' | ')}`
      );
    }
  }, [error]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {t('plans.title')}
          </h1>
          <p className="text-gray-500">{t('plans.signInToCreate')}</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/signin"
              className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              {t('auth.signIn')}
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {t('auth.signUp')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">{t('plans.loading')}</div>
      </div>
    );
  }

  if (error) {
    const friendlyError = getApiErrorMessage(error);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center max-w-md">
          <div className="text-red-600 font-semibold text-lg mb-2">
            {friendlyError.title}
          </div>
          <div className="text-gray-600 mb-4">{friendlyError.message}</div>
          {friendlyError.canRetry && (
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('plans.tryAgain')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return <PlansList plans={plans ?? []} />;
}
