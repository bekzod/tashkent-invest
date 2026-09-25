'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe2, LogIn, MapPinned, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readSession, sessionEventName, type Session } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';
import { localizedPath, switchPathLocale, type Locale } from '@/shared/i18n/routing';

export function PublicHeader({ pathname }: { pathname: string }) {
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { const sync = () => setSession(readSession()); queueMicrotask(sync); window.addEventListener(sessionEventName, sync); return () => window.removeEventListener(sessionEventName, sync); }, []);
  const loginHref = session
    ? (session.user.role === 'admin' ? '/dashboard' : '/dashboard/profile')
    : localizedPath(locale, '/login');
  const switchLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    router.push(
      switchPathLocale(
        `${pathname}${window.location.search}${window.location.hash}`,
        nextLocale,
      ),
    );
  };
  return (
    <header className="site-header">
      <Link href={localizedPath(locale, '/')} className="brand"><span className="brand-mark"><MapPinned size={23} /></span><span>Invest Tuman<small>{t('portalName')}</small></span></Link>
      <nav className="public-navigation" aria-label={t('mainNavigation')}>
        <Link href={localizedPath(locale, '/map')}>{t('map')}</Link>
        <Link href={localizedPath(locale, '/#projects')}>{t('projects')}</Link>
        <Link href={localizedPath(locale, '/map?statuses=auction')}>{t('auctions')}</Link>
        <Link href={localizedPath(locale, '/#news')}>{t('news')}</Link>
      </nav>
      <div className="header-actions">
        <label className="locale-select"><Globe2 size={14}/><select aria-label={t('language')} value={locale} onChange={(event) => switchLocale(event.target.value as Locale)}><option value="uz">O‘z</option><option value="ru">RU</option></select></label>
        <Link className="button primary register-button" href={loginHref}>{t('login')}<LogIn size={17} aria-hidden="true" /></Link>
      </div>
      <Menu className="mobile-menu" aria-label={t('menu')} />
    </header>
  );
}
