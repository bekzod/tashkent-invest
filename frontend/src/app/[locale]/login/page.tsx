import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/shared/i18n/routing';
import { LoginView } from '@/views/login';

export const metadata: Metadata = {
  title: 'Investor kabinetiga kirish',
  description: 'Invest Tuman investor kabinetiga xavfsiz kirish sahifasi.',
  robots: { index: false, follow: false },
};

export default async function LocalizedLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LoginView />;
}
