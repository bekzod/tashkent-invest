"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { readSession } from "@/shared/auth/session";
import { useLanguage } from "@/shared/i18n/language-provider";

export function ApplicationForm({ objectId }: { objectId: string }) {
  const { locale, t } = useLanguage();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  if (!readSession())
    return (
      <Link className="button primary" href="/login">
        {t("login")}
      </Link>
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await api(
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
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form className="application-form" onSubmit={submit}>
      <h2>{t("application")}</h2>
      {done && <p className="success">{t("applicationDone")}</p>}
      {error && <p className="error">{error}</p>}
      <label>
        {t("name")}
        <input name="name" required />
      </label>
      <label>
        {t("company")}
        <input name="company" />
      </label>
      <label>
        {t("country")}
        <input name="country" />
      </label>
      <label>
        {t("phone")}
        <input name="phone" required />
      </label>
      <label>
        {t("email")}
        <input name="email" type="email" required />
      </label>
      <label>
        {t("telegram")}
        <input name="telegram" />
      </label>
      <label>
        {t("investmentAmount")}
        <input name="investmentAmountUsd" type="number" min="0" step="1" />
      </label>
      <label>
        {t("projectDescription")}
        <textarea name="projectDescription" rows={3} />
      </label>
      <label>
        {t("comment")}
        <textarea name="comment" rows={3} />
      </label>
      <button className="button primary" disabled={submitting}>
        {t("submit")}
      </button>
    </form>
  );
}
