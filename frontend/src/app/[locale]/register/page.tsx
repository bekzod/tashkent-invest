import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeReturnTo } from "@/shared/auth/return-to";
import { isLocale } from "@/shared/i18n/routing";
import { registerMetadata } from "@/shared/lib/seo";
import { RegisterView } from "@/views/register";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return registerMetadata(locale);
}

export default async function RegisterPage({
  params,
  searchParams,
}: RegisterPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const rawReturnTo = (await searchParams).returnTo;
  const candidate = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;
  const returnTo = safeReturnTo(candidate, "") || undefined;

  return <RegisterView returnTo={returnTo} />;
}
