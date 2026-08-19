'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Locale, type MessageKey, messages } from './messages';

const storageKey = 'tashkent-invest.locale';
type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved !== 'uz' && saved !== 'ru') return;
    queueMicrotask(() => setLocaleState(saved));
  }, []);
  const value = useMemo(() => ({ locale, setLocale: (next: Locale) => { window.localStorage.setItem(storageKey, next); setLocaleState(next); }, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error('LanguageProvider is required'); return context; }
