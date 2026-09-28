"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { statusMessageKey } from "@/shared/lib/dashboard";

type Status = "received" | "in_review" | "approved" | "rejected";
type AdminApplication = {
  id: string;
  status: Status;
  name: string;
  company?: string | null;
  country?: string | null;
  phone: string;
  email: string;
  telegram?: string | null;
  investmentAmountUsd?: number | null;
  projectDescription?: string | null;
  comment?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  object: { title: string; slug: string };
};
type Response = {
  items: AdminApplication[];
  meta: { page: number; total: number; totalPages: number };
};

export function AdminApplications() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<AdminApplication[]>([]);
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) query.set("status", status);
      const response = await api<Response>(
        `/admin/applications?${query}`,
        {},
        locale,
      );
      setError(null);
      setItems(response.items);
      setTotalPages(response.meta.totalPages);
      setSelected((current) =>
        current
          ? (response.items.find((item) => item.id === current.id) ?? null)
          : null,
      );
    } catch {
      setError(t("dataLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [locale, page, status, t]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) query.set("status", status);
    api<Response>(`/admin/applications?${query}`, {}, locale)
      .then((response) => {
        if (!active) return;
        setError(null);
        setItems(response.items);
        setTotalPages(response.meta.totalPages);
        setSelected((current) =>
          current
            ? (response.items.find((item) => item.id === current.id) ?? null)
            : null,
        );
      })
      .catch(() => {
        if (active) setError(t("dataLoadFailed"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale, page, status, t]);

  async function transition(nextStatus: Exclude<Status, "received">) {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await api<AdminApplication>(
        `/admin/applications/${selected.id}/status`,
        { method: "PUT", body: JSON.stringify({ status: nextStatus, note }) },
        locale,
      );
      setSelected(updated);
      setNote(updated.reviewNote ?? "");
      setMessage(t("applicationReviewSaved"));
      await load();
    } catch {
      setError(t("applicationReviewFailed"));
    } finally {
      setSaving(false);
    }
  }

  function statusLabel(value: Status) {
    const key = statusMessageKey(value);
    return key ? t(key) : value;
  }

  return (
    <section className="admin-page admin-application-page">
      <header className="admin-page-header admin-application-header">
        <div>
          <p>{t("adminApplications").toUpperCase()}</p>
          <h1>{t("applicationInbox")}</h1>
        </div>
        <label>
          <span>{t("status")}</span>
          <select
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value as Status | "");
              setPage(1);
            }}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="received">{t("received")}</option>
            <option value="in_review">{t("inReview")}</option>
            <option value="approved">{t("approved")}</option>
            <option value="rejected">{t("rejected")}</option>
          </select>
        </label>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="success" role="status">
          {message}
        </p>
      ) : null}
      <div className="admin-application-layout">
        <div className="admin-application-list" aria-busy={loading}>
          {items.map((application) => (
            <button
              type="button"
              key={application.id}
              className={selected?.id === application.id ? "is-selected" : ""}
              onClick={() => {
                setSelected(application);
                setNote(application.reviewNote ?? "");
                setMessage(null);
              }}
              aria-pressed={selected?.id === application.id}
            >
              <span className="application-icon">
                <Clock3 size={18} />
              </span>
              <span>
                <strong>{application.object.title}</strong>
                <small>
                  {application.name} ·{" "}
                  {new Date(application.createdAt).toLocaleDateString(
                    locale === "ru" ? "ru-RU" : "uz-UZ",
                  )}
                </small>
              </span>
              <em className={`application-status ${application.status}`}>
                {statusLabel(application.status)}
              </em>
            </button>
          ))}
          {!loading && !items.length ? (
            <p className="dashboard-empty">{t("noAdminApplications")}</p>
          ) : null}
        </div>

        {selected ? (
          <article
            className="admin-application-detail"
            aria-label={t("applicationOpen")}
          >
            <header>
              <div>
                <p>{t("applicationApplicant")}</p>
                <h2>{selected.name}</h2>
              </div>
              <em className={`application-status ${selected.status}`}>
                {statusLabel(selected.status)}
              </em>
            </header>
            <dl>
              <div>
                <dt>{t("projects")}</dt>
                <dd>{selected.object.title}</dd>
              </div>
              <div>
                <dt>{t("email")}</dt>
                <dd>
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </dd>
              </div>
              <div>
                <dt>{t("phone")}</dt>
                <dd>
                  <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                </dd>
              </div>
              {selected.company ? (
                <div>
                  <dt>{t("company")}</dt>
                  <dd>{selected.company}</dd>
                </div>
              ) : null}
              {selected.country ? (
                <div>
                  <dt>{t("country")}</dt>
                  <dd>{selected.country}</dd>
                </div>
              ) : null}
              {selected.investmentAmountUsd ? (
                <div>
                  <dt>{t("investmentAmount")}</dt>
                  <dd>
                    ${selected.investmentAmountUsd.toLocaleString("en-US")}
                  </dd>
                </div>
              ) : null}
            </dl>
            {selected.projectDescription ? (
              <div className="admin-application-copy">
                <b>{t("projectDescription")}</b>
                <p>{selected.projectDescription}</p>
              </div>
            ) : null}
            {selected.comment ? (
              <div className="admin-application-copy">
                <b>{t("comment")}</b>
                <p>{selected.comment}</p>
              </div>
            ) : null}
            {selected.status === "received" ||
            selected.status === "in_review" ? (
              <label className="admin-review-note">
                <span>{t("applicationReviewNote")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </label>
            ) : selected.reviewNote ? (
              <div className="admin-application-copy">
                <b>{t("applicationReviewNote")}</b>
                <p>{selected.reviewNote}</p>
              </div>
            ) : null}
            <div className="admin-review-actions">
              {selected.status === "received" ? (
                <button
                  type="button"
                  className="admin-primary"
                  disabled={saving}
                  onClick={() => void transition("in_review")}
                >
                  <Clock3 size={17} />
                  {t("applicationStartReview")}
                </button>
              ) : null}
              {selected.status === "in_review" ? (
                <>
                  <button
                    type="button"
                    className="admin-primary"
                    disabled={saving}
                    onClick={() => void transition("approved")}
                  >
                    <Check size={17} />
                    {t("applicationApprove")}
                  </button>
                  <button
                    type="button"
                    className="admin-danger"
                    disabled={saving}
                    onClick={() => void transition("rejected")}
                  >
                    <X size={17} />
                    {t("applicationReject")}
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>

      <nav className="server-pagination" aria-label={t("resultsPagination")}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => {
            setLoading(true);
            setPage((value) => value - 1);
          }}
          aria-label={t("previousPage")}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => {
            setLoading(true);
            setPage((value) => value + 1);
          }}
          aria-label={t("nextPage")}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </section>
  );
}
