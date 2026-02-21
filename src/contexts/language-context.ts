import { createContext } from 'react';

export type AppLanguage = 'en' | 'he';

export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);
