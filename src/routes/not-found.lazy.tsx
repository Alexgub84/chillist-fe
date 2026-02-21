import { createLazyFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createLazyFileRoute('/not-found')({
  component: NotFound,
});

function NotFound() {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        {t('notFound.title')}
      </h1>
      <p style={{ marginBottom: '1rem' }}>{t('notFound.message')}</p>
      <Link
        to="/plans"
        style={{ color: '#2563eb', textDecoration: 'underline' }}
      >
        {t('notFound.backToPlans')}
      </Link>
    </div>
  );
}

export default NotFound;
