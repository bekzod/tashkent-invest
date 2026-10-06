"use client";

import { useEffect, useState } from "react";
import { readSession, type Session } from "@/shared/auth/session";
import { withReturnTo } from "@/shared/auth/return-to";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";

export function dashboardLoginHref(locale: "uz" | "ru", returnTo: string) {
  return withReturnTo(localizedPath(locale, "/login"), returnTo);
}

export function useDashboardSession() {
  const { locale } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(dashboardLoginHref(locale, returnTo));
      return;
    }
    queueMicrotask(() => setSession(current));
  }, [locale]);

  return session;
}
