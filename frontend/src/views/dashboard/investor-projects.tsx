"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { ServerPagination } from "@/shared/ui/server-pagination";
import { DashboardObjectGrid } from "./object-grid";
import type { ObjectResponse } from "./types";

export function InvestorProjects() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<ObjectResponse["items"]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ limit: "12", page: String(page) });
    if (appliedQuery) params.set("q", appliedQuery);
    if (status) params.set("status", status);
    try {
      const response = await api<ObjectResponse>(`/objects?${params}`, { signal }, locale);
      if (signal?.aborted) return;
      setItems(response.items);
      setMeta({ total: response.meta.total, totalPages: response.meta.totalPages ?? 1, limit: response.meta.limit ?? 12 });
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [appliedQuery, locale, page, status]);

  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => void load(controller.signal)); return () => controller.abort(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setPage(1); setAppliedQuery(query.trim()); };

  return (
    <PageLayout>
      <PageHeader title={t("projects")} description={t("findOpportunityText")} actions={<Button asChild><Link href="/dashboard/map">{t("openMap")}</Link></Button>} />
      <form onSubmit={submit}><FilterToolbar><div className="relative min-w-56 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("adminSearch")} /></div><Select value={status || "all"} onValueChange={(value) => { setPage(1); setStatus(value === "all" ? "" : value); }}><SelectTrigger className="w-full sm:w-48" aria-label={t("status")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("allStatuses")}</SelectItem><SelectItem value="available">{t("available")}</SelectItem><SelectItem value="auction">{t("auction")}</SelectItem><SelectItem value="upcoming">{t("upcoming")}</SelectItem></SelectContent></Select><Button type="submit">{t("showObjects")}</Button></FilterToolbar></form>
      {error ? <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} /> : items.length || loading ? <DashboardObjectGrid items={items} loading={loading} /> : <EmptyState title={t("noProjectsYet")} action={<Button asChild variant="outline"><Link href="/dashboard/map">{t("openMap")}</Link></Button>} />}
      {!error && !loading ? <ServerPagination currentPage={page} totalPages={meta.totalPages} pageSize={meta.limit} totalItems={meta.total} onPageChange={setPage} onPageSizeChange={() => undefined} pageSizeOptions={[12]} /> : null}
    </PageLayout>
  );
}
