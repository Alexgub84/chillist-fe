import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
  error?: Error | null;
}

export function ErrorPage({ error }: ErrorPageProps) {
  const { t } = useTranslation();
  return (
    <div
      className="error-page"
      style={{ padding: '2rem', textAlign: 'center' }}
    >
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
        {t('errors.somethingWentWrong')}
      </h1>
      <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>
        {error?.message ?? t('errors.unexpectedError')}
      </div>
      <div>
        <Link
          to="/plans"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          {t('errors.backToPlans')}
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;
