"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, PencilLine, Archive } from "lucide-react";
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

const statuses = ["draft", "available", "auction", "upcoming", "archived"];
const initialMeta: AdminObjectsMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export function AdminObjectsList() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<AdminObject[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<AdminObjectsMeta>(initialMeta);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [topbarTarget, setTopbarTarget] = useState<HTMLElement | null>(null);
  const requestSeq = useRef(0);

  const loadObjects = useCallback(async () => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    setLoading(true);
    try {
      const response = await adminObjectsApi.list({ page, limit, q: query, status });
      if (requestSeq.current !== requestId) return;
      setItems(response.items);
      setMeta(response.meta);
    } catch {
      if (requestSeq.current !== requestId) return;
      setItems([]);
      setMeta(initialMeta);
      notify.error(t("requestFailed"));
    } finally {
      if (requestSeq.current === requestId) setLoading(false);
    }
  }, [limit, page, query, status, t]);

  useEffect(() => {
    queueMicrotask(() => void loadObjects());
  }, [loadObjects]);

  useEffect(() => {
    queueMicrotask(() => setTopbarTarget(document.getElementById("dashboard-page-actions")));
    return () => setTopbarTarget(null);
  }, []);

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
        cell: (item) => item.district || "—",
      },
      {
        id: "status",
        header: t("status"),
        cell: (item) => <span className={`admin-status ${item.status}`}>{statusMessageKey(item.status) ? t(statusMessageKey(item.status)!) : item.status}</span>,
      },
      {
        id: "media",
        header: t("stepMedia"),
        align: "center",
        cell: (item) => item.media?.length || 0,
      },
      {
        id: "actions",
        header: "",
        align: "right",
        cell: (item) => (
          <div className="admin-table-actions">
            <Button asChild variant="ghost" size="icon"><Link aria-label={t("edit")} href={`/dashboard/projects/${item.id}/edit`}><PencilLine size={17} /></Link></Button>
            {item.status !== "archived" && (
              <Button aria-label={t("archive")} variant="ghost" size="icon" onClick={() => setArchiveTarget(item.id)}><Archive size={17} /></Button>
            )}
          </div>
        ),
      },
    ],
    [locale, t],
  );
  const updateQuery = (value: string) => {
    setQuery(value);
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
  const toolbar = (
    <div className="admin-topbar-tools">
      <div className="admin-topbar-search">
        <Search size={16} />
        <Input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t("adminSearch")}
        />
      </div>
      <Select value={status || "all"} onValueChange={(value) => updateStatus(value === "all" ? "" : value)}>
        <SelectTrigger className="admin-topbar-select" aria-label={t("status")}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
        {statuses.map((value) => (
          <SelectItem key={value} value={value}>
            {statusMessageKey(value) ? t(statusMessageKey(value)!) : value}
          </SelectItem>
        ))}
        </SelectContent>
      </Select>
      <Button asChild className="admin-primary admin-topbar-create"><Link href="/dashboard/projects/new"><Plus size={17} /> {t("newObject")}</Link></Button>
    </div>
  );

  return (
    <section className="admin-page admin-page--table">
      {topbarTarget ? createPortal(toolbar, topbarTarget) : <div className="admin-page-toolbar-fallback">{toolbar}</div>}
      <ListTable
        columns={columns}
        data={items}
        getRowId={(item) => item.id}
        loading={loading}
        emptyState={<p>{t("noMatchingObjects")}</p>}
      />
      <ServerPagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        pageSize={meta.limit}
        totalItems={meta.total}
        onPageChange={setPage}
        onPageSizeChange={updatePageSize}
      />
      <Dialog open={Boolean(archiveTarget)} onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("archive")}</DialogTitle><DialogDescription>{t("archiveConfirm")}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>{t("cancelDrawing")}</Button>
            <Button variant="destructive" onClick={() => void archive()}>{t("archive")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
