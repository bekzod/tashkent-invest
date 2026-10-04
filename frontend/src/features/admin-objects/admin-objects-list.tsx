"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, PencilLine, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTable, type ListTableColumn } from "@/shared/ui/list-table";
import { ServerPagination } from "@/shared/ui/server-pagination";
import { adminObjectsApi } from "./api";
import type { AdminObject, AdminObjectsMeta } from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";
import { statusMessageKey } from "@/shared/lib/dashboard";
import { notify } from "@/shared/ui/feedback";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { StatusBadge, type StatusTone } from "@/shared/ui/status-badge";
import { ActionIconButton } from "@/shared/ui/action-icon-button";

const statuses = ["draft", "available", "auction", "upcoming", "archived"];
const initialMeta: AdminObjectsMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export function AdminObjectsList() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<AdminObject[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<AdminObjectsMeta>(initialMeta);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const loadObjects = useCallback(async () => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    setLoading(true);
    setLoadError(false);
    try {
      const response = await adminObjectsApi.list({ page, limit, q: query, status });
      if (requestSeq.current !== requestId) return;
      setItems(response.items);
      setMeta(response.meta);
    } catch {
      if (requestSeq.current !== requestId) return;
      setItems([]);
      setMeta(initialMeta);
      setLoadError(true);
      notify.error(t("requestFailed"));
    } finally {
      if (requestSeq.current === requestId) setLoading(false);
    }
  }, [limit, page, query, status, t]);

  useEffect(() => {
    queueMicrotask(() => void loadObjects());
  }, [loadObjects]);

  const archive = useCallback(async () => {
    if (!archiveTarget) return;
    try {
      await adminObjectsApi.archive(archiveTarget);
      setArchiveTarget(null);
      await loadObjects();
    } catch {
      notify.error(t("requestFailed"));
    }
  }, [archiveTarget, loadObjects, t]);

  const columns = useMemo<ListTableColumn<AdminObject>[]>(
    () => [
      {
        id: "object",
        header: t("objectsBack"),
        cell: (item) => (
          <span className="admin-object-cell">
            <b>
              {item.translations?.find((translation) => translation.locale === locale)?.title ||
                item.translations?.find((translation) => translation.locale === "uz")?.title ||
                t("unnamedDraft")}
            </b>
            <small>{item.cadastralNumber || t("cadastralMissing")}</small>
          </span>
        ),
      },
      {
        id: "district",
        header: t("location"),
        headerClassName: "hidden md:table-cell",
        cellClassName: "hidden md:table-cell",
        cell: (item) => item.district || "—",
      },
      {
        id: "status",
        header: t("status"),
        cell: (item) => <StatusBadge tone={statusTone(item.status)}>{statusMessageKey(item.status) ? t(statusMessageKey(item.status)!) : item.status}</StatusBadge>,
      },
      {
        id: "media",
        header: t("stepMedia"),
        align: "center",
        headerClassName: "hidden lg:table-cell",
        cellClassName: "hidden lg:table-cell",
        cell: (item) => item.media?.length || 0,
      },
      {
        id: "actions",
        header: "",
        align: "right",
        cell: (item) => (
          <div className="admin-table-actions">
            <ActionIconButton asChild label={t("edit")} variant="ghost"><Link href={`/dashboard/projects/${item.id}/edit`}><PencilLine size={17} aria-hidden="true" /></Link></ActionIconButton>
            {item.status !== "archived" && (
              <ActionIconButton label={t("archive")} variant="ghost" onClick={() => setArchiveTarget(item.id)}><Archive size={17} aria-hidden="true" /></ActionIconButton>
            )}
          </div>
        ),
      },
    ],
    [locale, t],
  );
  const submitQuery = (event: FormEvent) => {
    event.preventDefault();
    setQuery(queryInput.trim());
    setPage(1);
  };
  const updateStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const updatePageSize = (value: number) => {
    setLimit(value);
    setPage(1);
  };
  const clearFilters = () => {
    setQueryInput("");
    setQuery("");
    setStatus("");
    setPage(1);
  };

  return (
    <PageLayout>
      <PageHeader title={t("objectsBack")} actions={<Button asChild><Link href="/dashboard/projects/new"><Plus size={17} />{t("newObject")}</Link></Button>} />
      <form onSubmit={submitQuery}>
        <FilterToolbar aria-label={t("objectsBack")}>
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input className="pl-9" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder={t("adminSearch")} />
          </div>
          <Select value={status || "all"} onValueChange={(value) => updateStatus(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-48" aria-label={t("status")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              {statuses.map((value) => <SelectItem key={value} value={value}>{statusMessageKey(value) ? t(statusMessageKey(value)!) : value}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit">{t("showObjects")}</Button>
          {query || status ? <ActionIconButton type="button" label={t("clear")} variant="ghost" onClick={clearFilters}><RotateCcw size={17} aria-hidden="true" /></ActionIconButton> : null}
        </FilterToolbar>
      </form>
      {loadError ? <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void loadObjects()}>{t("retry")}</Button>} /> : <ListTable
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        loading={loading}
        emptyState={<EmptyState className="min-h-44 border-0" title={t("noMatchingObjects")} />}
      />}
      {!loadError ? <ServerPagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        pageSize={meta.limit}
        totalItems={meta.total}
        onPageChange={setPage}
        onPageSizeChange={updatePageSize}
      /> : null}
      <Dialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("archive")}</DialogTitle><DialogDescription>{t("archiveConfirm")}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>{t("cancelDrawing")}</Button>
            <Button variant="destructive" onClick={() => void archive()}>{t("archive")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function statusTone(status: AdminObject["status"]): StatusTone {
  if (status === "available") return "success";
  if (status === "auction" || status === "upcoming") return "warning";
  if (status === "archived") return "danger";
  return "neutral";
}
