import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeReturnTo } from "@/shared/auth/return-to";
import { isLocale } from "@/shared/i18n/routing";
import { loginMetadata } from "@/shared/lib/seo";
import { LoginView } from "@/views/login";

type LocalizedLoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    returnTo?: string | string[];
    email?: string | string[];
    password?: string | string[];
  }>;
};

function firstSearchValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: LocalizedLoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return loginMetadata(locale);
}

export default async function LocalizedLoginPage({
  params,
  searchParams,
}: LocalizedLoginPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const candidate = firstSearchValue(query.returnTo);
  const returnTo = safeReturnTo(candidate, "") || undefined;
  const initialCredentials =
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          email: firstSearchValue(query.email),
          password: firstSearchValue(query.password),
        };

  return (
    <LoginView
      returnTo={returnTo}
      initialCredentials={initialCredentials}
    />
  );
}
