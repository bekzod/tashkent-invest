"use client";

import { Check, Clock3, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { statusMessageKey } from "@/shared/lib/dashboard";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { DashboardListSkeleton } from "@/shared/ui/dashboard-loading";
import { notify } from "@/shared/ui/feedback";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { ServerPagination } from "@/shared/ui/server-pagination";
import { StatusBadge, type StatusTone } from "@/shared/ui/status-badge";

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

const initialMeta = { page: 1, total: 0, totalPages: 1 };

export function AdminApplications() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<AdminApplication[]>([]);
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(initialMeta);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(false);
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) query.set("status", status);
      const response = await api<Response>(`/admin/applications?${query}`, { signal }, locale);
      if (signal?.aborted) return;
      setItems(response.items);
      setMeta(response.meta);
      setSelected((current) => current ? (response.items.find((item) => item.id === current.id) ?? null) : null);
    } catch {
      if (!signal?.aborted) {
        setLoadError(true);
        notify.error(t("dataLoadFailed"));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [locale, page, status, t]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void load(controller.signal));
    return () => controller.abort();
  }, [load]);

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
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNote(updated.reviewNote ?? "");
      notify.success(t("applicationReviewSaved"));
    } catch {
      notify.error(t("applicationReviewFailed"));
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = (value: Status) => {
    const key = statusMessageKey(value);
    return key ? t(key) : value;
  };

  const openApplication = (application: AdminApplication) => {
    setSelected(application);
    setNote(application.reviewNote ?? "");
  };

  return (
    <PageLayout>
      <PageHeader title={t("applicationInbox")} description={t("adminApplications")} />
      <FilterToolbar aria-label={t("adminApplications")}>
        <span className="text-sm font-semibold text-muted-foreground">{t("status")}</span>
        <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value as Status); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-52" aria-label={t("status")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="received">{t("received")}</SelectItem>
            <SelectItem value="in_review">{t("inReview")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
            <SelectItem value="rejected">{t("rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </FilterToolbar>

      {loadError ? (
        <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} />
      ) : loading ? (
        <DashboardListSkeleton label={t("dashboardLoading")} rows={5} />
      ) : items.length ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {items.map((application) => (
              <Button
                key={application.id}
                variant="ghost"
                className="h-auto min-h-16 w-full justify-start rounded-none px-4 py-3 text-left first:rounded-t-md last:rounded-b-md"
                onClick={() => openApplication(application)}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Clock3 size={17} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{application.object.title}</strong>
                  <small className="block truncate text-xs font-normal text-muted-foreground">{application.name} · {new Date(application.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ")}</small>
                </span>
                <StatusBadge tone={statusTone(application.status)}>{statusLabel(application.status)}</StatusBadge>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title={t("noAdminApplications")} />
      )}

      {!loadError && !loading ? <ServerPagination currentPage={meta.page} totalPages={meta.totalPages} pageSize={20} totalItems={meta.total} pageSizeOptions={[20]} onPageChange={setPage} onPageSizeChange={() => undefined} /> : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[min(40rem,94vw)] overflow-y-auto" closeLabel={t("closeNotifications")}>
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.object.title}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{t("applicationApplicant")}</p>
                  <StatusBadge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</StatusBadge>
                </div>
                <dl className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
                  <ApplicationField label={t("projects")} value={selected.object.title} />
                  <ApplicationField label={t("email")} value={<a className="text-primary hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a>} />
                  <ApplicationField label={t("phone")} value={<a className="text-primary hover:underline" href={`tel:${selected.phone}`}>{selected.phone}</a>} />
                  {selected.company ? <ApplicationField label={t("company")} value={selected.company} /> : null}
                  {selected.country ? <ApplicationField label={t("country")} value={selected.country} /> : null}
                  {selected.investmentAmountUsd ? <ApplicationField label={t("investmentAmount")} value={`$${selected.investmentAmountUsd.toLocaleString("en-US")}`} /> : null}
                </dl>
                {selected.projectDescription ? <ApplicationCopy label={t("projectDescription")} value={selected.projectDescription} /> : null}
                {selected.comment ? <ApplicationCopy label={t("comment")} value={selected.comment} /> : null}
                {selected.status === "received" || selected.status === "in_review" ? (
                  <Label className="grid gap-2">
                    <span>{t("applicationReviewNote")}</span>
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={5} />
                  </Label>
                ) : selected.reviewNote ? <ApplicationCopy label={t("applicationReviewNote")} value={selected.reviewNote} /> : null}
                <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  {selected.status === "received" ? <Button disabled={saving} onClick={() => void transition("in_review")}><Clock3 size={17} />{t("applicationStartReview")}</Button> : null}
                  {selected.status === "in_review" ? <><Button disabled={saving} onClick={() => void transition("approved")}><Check size={17} />{t("applicationApprove")}</Button><Button variant="destructive" disabled={saving} onClick={() => void transition("rejected")}><X size={17} />{t("applicationReject")}</Button></> : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}

function ApplicationField({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>;
}

function ApplicationCopy({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-muted p-4"><b className="text-sm">{label}</b><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p></div>;
}

function statusTone(status: Status): StatusTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "in_review") return "warning";
  return "info";
}
