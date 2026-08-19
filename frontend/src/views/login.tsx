"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/api/client";
import { writeSession, type Session } from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";

export function LoginView() {
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
        session.user.role === "admin" ? "/admin" : "/dashboard/profile",
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
        <p className="demo-hint">
          Investor: investor@demo.uz / invest2026
          <br />
          Admin: admin@demo.uz / invest2026
        </p>
        {error && <p className="error">{t("loginFailed")}</p>}
        <label>
          {t("email")}
          <input
            name="email"
            type="email"
            required
            defaultValue="investor@demo.uz"
          />
        </label>
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            required
            defaultValue="invest2026"
          />
        </label>
        <button className="button primary" disabled={pending}>
          {t("login")}
        </button>
      </form>
    </main>
  );
}
