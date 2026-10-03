"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/shared/api/client";
import { readSession, type Session } from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { withReturnTo } from "@/shared/auth/return-to";
import type { MessageKey } from "@/shared/i18n/messages";
import { notify } from "@/shared/ui/feedback";

export function applicationErrorMessageKey(
  code?: string,
): MessageKey | undefined {
  const messagesByCode: Record<string, MessageKey> = {
    INVALID_APPLICATION: "applicationInvalid",
    OBJECT_NOT_AVAILABLE: "applicationObjectUnavailable",
    INVESTOR_ONLY: "applicationInvestorOnly",
    ACCOUNT_INACTIVE: "applicationAccountInactive",
    APPLICATION_CREATE_FAILED: "applicationCreateFailed",
  };
  return code ? messagesByCode[code] : undefined;
}

export function ApplicationForm({
  objectId,
  returnTo,
}: {
  objectId: string;
  returnTo?: string;
}) {
  const { locale, t } = useLanguage();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    queueMicrotask(() => setSession(readSession()));
  }, []);
  if (session === undefined) {
    return <p className="application-unavailable">{t("loading")}</p>;
  }
  if (!session)
    return (
      <div className="application-auth-actions">
        <p>{t("applicationLoginRequired")}</p>
        <Link
          className="button primary"
          href={withReturnTo(localizedPath(locale, "/login"), returnTo)}
        >
          {t("login")}
        </Link>
        <Link
          className="button ghost"
          href={withReturnTo(localizedPath(locale, "/register"), returnTo)}
        >
          {t("register")}
        </Link>
      </div>
    );
  if (session.user.role !== "investor") {
    return (
      <p className="application-unavailable">{t("applicationInvestorOnly")}</p>
    );
  }

  function errorMessage(caught: unknown) {
    if (!(caught instanceof ApiError)) return t("requestFailed");
    const key = applicationErrorMessageKey(caught.code);
    return key ? t(key) : t("requestFailed");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api<{ duplicate?: boolean }>(
        "/applications",
        {
          method: "POST",
          body: JSON.stringify({
            objectId,
            name: data.get("name"),
            company: data.get("company"),
            country: data.get("country"),
            phone: data.get("phone"),
            email: data.get("email"),
            telegram: data.get("telegram"),
            investmentAmountUsd: data.get("investmentAmountUsd"),
            projectDescription: data.get("projectDescription"),
            comment: data.get("comment"),
          }),
        },
        locale,
      );
      setDone(true);
      notify.success(
        response.duplicate ? t("applicationAlreadyExists") : t("applicationDone"),
      );
    } catch (caught) {
      notify.error(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form id="application" className="application-form" onSubmit={submit}>
      <h2>{t("application")}</h2>
      <fieldset disabled={submitting || done}>
        <label>
          {t("name")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={session.user.name}
            autoComplete="name"
          />
        </label>
        <label>
          {t("company")}
          <input name="company" maxLength={160} autoComplete="organization" />
        </label>
        <label>
          {t("country")}
          <input name="country" maxLength={100} autoComplete="country-name" />
        </label>
        <label>
          {t("phone")}
          <input
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={24}
            autoComplete="tel"
          />
        </label>
        <label>
          {t("email")}
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            defaultValue={session.user.email}
            autoComplete="email"
          />
        </label>
        <label>
          {t("telegram")}
          <input name="telegram" maxLength={80} />
        </label>
        <label>
          {t("investmentAmount")}
          <input
            name="investmentAmountUsd"
            type="number"
            min="1"
            max="1000000000000"
            step="0.01"
          />
        </label>
        <label>
          {t("projectDescription")}
          <textarea name="projectDescription" rows={3} maxLength={4000} />
        </label>
        <label>
          {t("comment")}
          <textarea name="comment" rows={3} maxLength={2000} />
        </label>
        <button className="button primary" disabled={submitting || done}>
          {submitting
            ? t("applicationSubmitting")
            : done
              ? t("applicationSubmitted")
              : t("submit")}
        </button>
      </fieldset>
    </form>
  );
}
