import { useEffect } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { usePlans } from '../hooks/usePlans';
import { PlansList } from '../components/PlansList';
import { getApiErrorMessage } from '../core/error-utils';

export const Route = createLazyFileRoute('/plans')({
  component: Plans,
});

function Plans() {
  const { t } = useTranslation();
  const { data: plans, isLoading, error, refetch } = usePlans();

  useEffect(() => {
    if (error) {
      console.error(
        `[Plans] Failed to fetch plans — "${error.message}". ` +
          `Name: ${error.name}, Stack: ${error.stack?.split('\n').slice(0, 3).join(' | ')}`
      );
    }
  }, [error]);

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
