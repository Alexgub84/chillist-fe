import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
} from '../contexts/language-context';
import en from './locales/en.json';
import he from './locales/he.json';

const STORAGE_KEY = 'chillist-lang';

function getSavedLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isSupportedLanguage(saved)) return saved;
  } catch {
    // localStorage unavailable (SSR, privacy mode)
  }
  return SUPPORTED_LANGUAGES[0];
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: getSavedLanguage(),
  fallbackLng: SUPPORTED_LANGUAGES[0],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
