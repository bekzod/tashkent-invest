"use client";

import { useEffect, useState } from "react";
import { readSession, type Session } from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";

export function useDashboardSession() {
  const { locale } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = readSession();
    if (!current) {
      window.location.replace(localizedPath(locale, "/login"));
      return;
    }
    queueMicrotask(() => setSession(current));
  }, [locale]);

  return session;
}
