import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { LocaleContext } from './useLocale';
import type { Locale, LocaleStrings } from './types';
import vi from './vi.json';
import en from './en.json';

const STRINGS: Record<Locale, LocaleStrings> = {
  vi: vi as LocaleStrings,
  en: en as LocaleStrings,
};

function resolvePath(obj: LocaleStrings, path: string): string {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : path;
}

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('cotecatlop.locale');
      if (saved === 'en' || saved === 'vi') return saved;
    } catch {
      /* ignore */
    }
    // Auto-detect nếu không có saved
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
    }
    return 'vi';
  });

  const setAndSave = useCallback((l: Locale) => {
    setLocale(l);
    try {
      localStorage.setItem('cotecatlop.locale', l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      const val = resolvePath(STRINGS[locale], key);
      if (val === key && locale !== 'vi') {
        // Fallback về vi nếu key tiếng Anh chưa có
        return resolvePath(STRINGS.vi, key);
      }
      return val;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale: setAndSave,
      t,
    }),
    [locale, setAndSave, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
