import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/shared/i18n/routing';
import { loginMetadata } from '@/shared/lib/seo';
import { LoginView } from '@/views/login';

type LocalizedLoginPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalizedLoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return loginMetadata(locale);
}

export default async function LocalizedLoginPage({
  params,
}: LocalizedLoginPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LoginView />;
}
