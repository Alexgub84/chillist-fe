import { createLazyFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createLazyFileRoute('/about')({
  component: About,
});

export function About() {
  const { t } = useTranslation();
  return (
    <div className="about">
      <h1>{t('about.title')}</h1>
      <p>{t('about.welcome')}</p>
    </div>
  );
}
