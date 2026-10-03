"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/shared/api/client";
import { writeSession, type Session } from "@/shared/auth/session";
import { safeReturnTo, withReturnTo } from "@/shared/auth/return-to";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { notify } from "@/shared/ui/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginCredentials = {
  email?: string;
  password?: string;
};

export function LoginView({
  returnTo,
  initialCredentials,
}: {
  returnTo?: string;
  initialCredentials?: LoginCredentials;
}) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const session = await api<Session>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: String(data.get("email") || "").trim().toLowerCase(),
            password: String(data.get("password") || ""),
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
    } catch (error) {
      notify.error(
        error instanceof ApiError && error.status === 401
          ? t("loginFailed")
          : t("requestFailed"),
      );
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
        <Label className="auth-label">
          {t("email")}
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={initialCredentials?.email || ""}
          />
        </Label>
        <Label className="auth-label">
          {t("password")}
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            defaultValue={initialCredentials?.password || ""}
          />
        </Label>
        <Button
          className="w-full"
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? t("loggingIn") : t("login")}
        </Button>
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
