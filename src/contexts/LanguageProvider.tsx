import { useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LanguageContext, type AppLanguage } from './language-context';

function applyDirection(lang: AppLanguage) {
  const html = document.documentElement;
  html.dir = lang === 'he' ? 'rtl' : 'ltr';
  html.lang = lang;
}

export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const [language, setStoredLanguage] = useLocalStorage<AppLanguage>(
    'chillist-lang',
    (i18n.language as AppLanguage) || 'en'
  );

  useEffect(() => {
    applyDirection(language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      setStoredLanguage(lang);
      i18n.changeLanguage(lang);
      applyDirection(lang);
    },
    [i18n, setStoredLanguage]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
