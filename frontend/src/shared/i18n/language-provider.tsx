'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type MessageKey, messages } from './messages';
import { defaultLocale, localeCookieName, type Locale } from './routing';

const storageKey = localeCookieName;
type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

function writeLocalePreference(locale: Locale) {
  window.localStorage.setItem(storageKey, locale);
  document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

export function LanguageProvider({ children, initialLocale = defaultLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const persistLocale = useCallback((next: Locale) => {
    writeLocalePreference(next);
    setLocaleState(next);
  }, []);
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/')) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved !== 'uz' && saved !== 'ru') return;
    queueMicrotask(() => persistLocale(saved));
  }, [persistLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    writeLocalePreference(locale);
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale: persistLocale, t: (key: MessageKey) => messages[locale][key] }), [locale, persistLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error('LanguageProvider is required'); return context; }
