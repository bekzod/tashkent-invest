'use client';

import Link from 'next/link';
import { useLanguage } from '@/shared/i18n/language-provider';

export function LocalizedNotFound() {
  const { t } = useLanguage();
  return <main className="center-state"><h1>404</h1><p>{t('pageNotFound')}</p><Link className="button primary" href="/">{t('home')}</Link></main>;
}
