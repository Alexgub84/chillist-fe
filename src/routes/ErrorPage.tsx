import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

interface ErrorWithStatus extends Error {
  status?: number;
}

interface ErrorPageProps {
  error?: Error | null;
}

export function ErrorPage({ error }: ErrorPageProps) {
  const { t } = useTranslation();
  const status = (error as ErrorWithStatus | undefined)?.status;
  const is404 = status === 404;

  return (
    <div className="py-16 px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {is404 ? t('errors.planNotFound') : t('errors.somethingWentWrong')}
      </h1>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {is404
          ? t('errors.planNoAccess')
          : (error?.message ?? t('errors.unexpectedError'))}
      </p>
      <Link
        to="/plans"
        className="text-blue-600 hover:text-blue-800 underline font-medium"
      >
        {t('errors.backToPlans')}
      </Link>
    </div>
  );
}

export default ErrorPage;
