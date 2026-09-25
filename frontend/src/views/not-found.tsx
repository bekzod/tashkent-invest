'use client';

import Link from 'next/link';
import { useLanguage } from '@/shared/i18n/language-provider';
import { localizedPath } from '@/shared/i18n/routing';

export function LocalizedNotFound() {
  const { locale, t } = useLanguage();
  return <main className="center-state"><h1>404</h1><p>{t('pageNotFound')}</p><Link className="button primary" href={localizedPath(locale, '/')}>{t('home')}</Link></main>;
}
