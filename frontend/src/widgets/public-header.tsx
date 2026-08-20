'use client';

import Link from 'next/link';
import { Globe2, LogIn, MapPinned, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { readSession, sessionEventName, type Session } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';

export function PublicHeader() {
  const { locale, setLocale, t } = useLanguage(); const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { const sync = () => setSession(readSession()); queueMicrotask(sync); window.addEventListener(sessionEventName, sync); return () => window.removeEventListener(sessionEventName, sync); }, []);
  const loginHref = session ? (session.user.role === 'admin' ? '/dashboard' : '/dashboard/profile') : '/login';
  return (
    <header className="site-header">
      <Link href="/" className="brand"><span className="brand-mark"><MapPinned size={23} /></span><span>Invest Tuman<small>Investment portal</small></span></Link>
      <nav className="public-navigation" aria-label="Asosiy navigatsiya">
        <Link href="/map">{t('map')}</Link>
        <Link href="/#projects">{t('projects')}</Link>
        <Link href="/map?statuses=auction">{t('auctions')}</Link>
        <Link href="/#news">{t('news')}</Link>
      </nav>
      <div className="header-actions">
        <label className="locale-select"><Globe2 size={14}/><select aria-label="Til" value={locale} onChange={(event) => setLocale(event.target.value as 'uz' | 'ru')}><option value="uz">O‘z</option><option value="ru">RU</option></select></label>
        <Link className="button primary register-button" href={loginHref}>{t('login')}<LogIn size={17} aria-hidden="true" /></Link>
      </div>
      <Menu className="mobile-menu" aria-label="Menyu" />
    </header>
  );
}
