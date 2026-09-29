import { createContext, useContext } from 'react';
import type { Locale } from './types';

export interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

export const LocaleContext = createContext<LocaleContextType>({
  locale: 'vi',
  setLocale: () => {},
  t: (key: string) => key,
});

export const useLocale = () => useContext(LocaleContext);
