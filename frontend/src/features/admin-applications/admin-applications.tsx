"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { statusMessageKey } from "@/shared/lib/dashboard";
import { notify } from "@/shared/ui/feedback";

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

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) query.set("status", status);
      const response = await api<Response>(
        `/admin/applications?${query}`,
        {},
        locale,
      );
      setItems(response.items);
      setTotalPages(response.meta.totalPages);
      setSelected((current) =>
        current
          ? (response.items.find((item) => item.id === current.id) ?? null)
          : null,
      );
    } catch {
      notify.error(t("dataLoadFailed"));
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
        setItems(response.items);
        setTotalPages(response.meta.totalPages);
        setSelected((current) =>
          current
            ? (response.items.find((item) => item.id === current.id) ?? null)
            : null,
        );
      })
      .catch(() => {
        if (active) notify.error(t("dataLoadFailed"));
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
    try {
      const updated = await api<AdminApplication>(
        `/admin/applications/${selected.id}/status`,
        { method: "PUT", body: JSON.stringify({ status: nextStatus, note }) },
        locale,
      );
      setSelected(updated);
      setNote(updated.reviewNote ?? "");
      notify.success(t("applicationReviewSaved"));
      await load();
    } catch {
      notify.error(t("applicationReviewFailed"));
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
        <Label>
          <span>{t("status")}</span>
          <Select value={status || "all"} onValueChange={(value) => {
              setLoading(true);
              setStatus(value === "all" ? "" : value as Status);
              setPage(1);
            }}>
            <SelectTrigger aria-label={t("status")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="received">{t("received")}</SelectItem>
              <SelectItem value="in_review">{t("inReview")}</SelectItem>
              <SelectItem value="approved">{t("approved")}</SelectItem>
              <SelectItem value="rejected">{t("rejected")}</SelectItem>
            </SelectContent>
          </Select>
        </Label>
      </header>

      <div className="admin-application-layout">
        <div className="admin-application-list" aria-busy={loading}>
          {items.map((application) => (
            <Button
              key={application.id}
              variant="ghost"
              className={selected?.id === application.id ? "is-selected" : ""}
              onClick={() => {
                setSelected(application);
                setNote(application.reviewNote ?? "");
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
            </Button>
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
              <Label className="admin-review-note">
                <span>{t("applicationReviewNote")}</span>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </Label>
            ) : selected.reviewNote ? (
              <div className="admin-application-copy">
                <b>{t("applicationReviewNote")}</b>
                <p>{selected.reviewNote}</p>
              </div>
            ) : null}
            <div className="admin-review-actions">
              {selected.status === "received" ? (
                <Button
                  className="admin-primary"
                  disabled={saving}
                  onClick={() => void transition("in_review")}
                >
                  <Clock3 size={17} />
                  {t("applicationStartReview")}
                </Button>
              ) : null}
              {selected.status === "in_review" ? (
                <>
                  <Button
                    className="admin-primary"
                    disabled={saving}
                    onClick={() => void transition("approved")}
                  >
                    <Check size={17} />
                    {t("applicationApprove")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="admin-danger"
                    disabled={saving}
                    onClick={() => void transition("rejected")}
                  >
                    <X size={17} />
                    {t("applicationReject")}
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>

      <nav className="server-pagination" aria-label={t("resultsPagination")}>
        <Button
          variant="ghost"
          size="icon"
          disabled={page <= 1}
          onClick={() => {
            setLoading(true);
            setPage((value) => value - 1);
          }}
          aria-label={t("previousPage")}
        >
          <ChevronLeft size={18} />
        </Button>
        <span>
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => {
            setLoading(true);
            setPage((value) => value + 1);
          }}
          aria-label={t("nextPage")}
        >
          <ChevronRight size={18} />
        </Button>
      </nav>
    </section>
  );
}
