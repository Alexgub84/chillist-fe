import { createContext } from 'react';

export interface LanguageMeta {
  code: AppLanguage;
  nativeLabel: string;
  currencySymbol: string;
  currencyCode: string;
}

export const SUPPORTED_LANGUAGES = ['en', 'he'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const RTL_LANGUAGES = new Set<AppLanguage>(['he']);

export const LANGUAGE_META: Record<AppLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    nativeLabel: 'English',
    currencySymbol: '$',
    currencyCode: 'USD',
  },
  he: {
    code: 'he',
    nativeLabel: 'עברית',
    currencySymbol: '₪',
    currencyCode: 'ILS',
  },
};

export function getCurrency(lang: AppLanguage): string {
  return LANGUAGE_META[lang].currencyCode;
}

export function getCurrencySymbol(lang: AppLanguage): string {
  return LANGUAGE_META[lang].currencySymbol;
}

export function isRtl(lang: AppLanguage): boolean {
  return RTL_LANGUAGES.has(lang);
}

export function getNextLanguage(current: AppLanguage): AppLanguage {
  const idx = SUPPORTED_LANGUAGES.indexOf(current);
  return SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
}

export function isSupportedLanguage(value: string): value is AppLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);
