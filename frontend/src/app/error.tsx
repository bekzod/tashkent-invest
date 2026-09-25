'use client';
import { useLanguage } from '@/shared/i18n/language-provider';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { const { t } = useLanguage(); return <main className="center-state"><h1>{t('somethingWentWrong')}</h1><button className="button primary" onClick={() => reset()}>{t('retry')}</button></main>; }
