import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: HomePage,
});

function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();

  const suffix = language === 'he' ? '-he' : '';
  const ctaTo = user ? '/plans' : '/signup';
  const bottomCtaTo = user ? '/create-plan' : '/signup';

  return (
    <div className="flex flex-col gap-16 sm:gap-24 py-6 sm:py-12">
      <RevealSection>
        <section className="flex flex-col items-center text-center gap-6 sm:gap-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight">
            {t('home.headline')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-xl">
            {t('home.subtitle')}
          </p>

          <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/hero.jpg"
              alt={t('home.heroAlt')}
              className="w-full h-48 sm:h-72 object-cover"
            />
          </div>

          <Link
            to={ctaTo}
            className="rounded-lg bg-blue-600 px-8 py-3 text-base sm:text-lg font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
          >
            {t('home.cta')}
          </Link>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="flex flex-col items-center gap-10 sm:gap-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('home.howItWorks')}
          </h2>

          <div className="flex flex-col gap-12 sm:gap-16 w-full max-w-4xl">
            <RevealSection>
              <StepCard
                step={1}
                imageSrc={`/step-1${suffix}.png`}
                imageAlt={t('home.step1Alt')}
                title={t('home.step1Title')}
                description={t('home.step1Desc')}
              />
            </RevealSection>
            <RevealSection>
              <StepCard
                step={2}
                imageSrc={`/step-2${suffix}.png`}
                imageAlt={t('home.step2Alt')}
                title={t('home.step2Title')}
                description={t('home.step2Desc')}
                reverse
              />
            </RevealSection>
            <RevealSection>
              <StepCard
                step={3}
                imageSrc={`/step-3${suffix}.png`}
                imageAlt={t('home.step3Alt')}
                title={t('home.step3Title')}
                description={t('home.step3Desc')}
              />
            </RevealSection>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="flex flex-col items-center text-center gap-6 pb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t('home.bottomHeadline')}
          </h2>
          <Link
            to={bottomCtaTo}
            className="rounded-lg bg-blue-600 px-8 py-3 text-base sm:text-lg font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
          >
            {t('home.bottomCta')}
          </Link>
        </section>
      </RevealSection>
    </div>
  );
}

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {!failed && (
        <img
          src={src}
          alt={alt}
          className={
            loaded
              ? 'w-full h-64 sm:h-72 object-cover object-top'
              : 'w-0 h-0 absolute'
          }
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && (
        <div className="flex items-center justify-center h-64 sm:h-72 bg-gray-50 text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="h-12 w-12"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function StepCard({
  step,
  imageSrc,
  imageAlt,
  title,
  description,
  reverse,
}: {
  step: number;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-10 ${reverse ? 'sm:flex-row-reverse' : ''}`}
    >
      <div className="w-full max-w-[240px] sm:max-w-none sm:w-2/5">
        <StepImage src={imageSrc} alt={imageAlt} />
      </div>
      <div className="flex flex-col items-center sm:items-start text-center sm:text-start gap-3 w-full sm:w-3/5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
          {step}
        </span>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-base text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
