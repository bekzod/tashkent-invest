"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/api/client";
import { writeSession, type Session } from "@/shared/auth/session";
import { safeReturnTo, withReturnTo } from "@/shared/auth/return-to";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";

export function LoginView({ returnTo }: { returnTo?: string }) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(false);
    try {
      const session = await api<Session>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
          }),
        },
        locale,
      );
      writeSession(session);
      router.replace(
        safeReturnTo(
          returnTo,
          session.user.role === "admin" ? "/dashboard" : "/dashboard/profile",
        ),
      );
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={submit}
        data-testid="login-form"
        data-hydrated={hydrated ? "true" : "false"}
      >
        <h1>{t("loginTitle")}</h1>
        {process.env.NODE_ENV === "development" && (
          <p className="demo-hint">
            {t("investorDefaultName")}: investor@demo.uz / invest2026
            <br />
            {t("adminDefaultName")}: admin@demo.uz / invest2026
          </p>
        )}
        {error && (
          <p className="error auth-status" role="alert">
            {t("loginFailed")}
          </p>
        )}
        <label>
          {t("email")}
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button
          className="button primary"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? t("loggingIn") : t("login")}
        </button>
        <p className="auth-switch">
          {t("noAccountYet")}{" "}
          <Link
            href={withReturnTo(localizedPath(locale, "/register"), returnTo)}
          >
            {t("register")}
          </Link>
        </p>
      </form>
    </main>
  );
}
