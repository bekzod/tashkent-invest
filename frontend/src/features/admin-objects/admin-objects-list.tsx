"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, PencilLine, Archive } from "lucide-react";
import { ListTable, type ListTableColumn } from "@/shared/ui/list-table";
import { ServerPagination } from "@/shared/ui/server-pagination";
import { adminObjectsApi } from "./api";
import type { AdminObject, AdminObjectsMeta } from "./types";

const statuses = ["draft", "available", "auction", "upcoming", "archived"];
const initialMeta: AdminObjectsMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export function AdminObjectsList() {
  const [items, setItems] = useState<AdminObject[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<AdminObjectsMeta>(initialMeta);
  const [loading, setLoading] = useState(true);
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
    } finally {
      if (requestSeq.current === requestId) setLoading(false);
    }
  }, [limit, page, query, status]);

  useEffect(() => {
    queueMicrotask(() => void loadObjects());
  }, [loadObjects]);

  useEffect(() => {
    queueMicrotask(() => setTopbarTarget(document.getElementById("dashboard-page-actions")));
    return () => setTopbarTarget(null);
  }, []);

  const archive = useCallback(async (id: string) => {
    if (
      !window.confirm(
        "Obyekt investorlar xaritasidan olib tashlanadi. Davom etilsinmi?",
      )
    )
      return;
    await adminObjectsApi.archive(id);
    await loadObjects();
  }, [loadObjects]);

  const columns = useMemo<ListTableColumn<AdminObject>[]>(
    () => [
      {
        id: "object",
        header: "Obyekt",
        cell: (item) => (
          <span className="admin-object-cell">
            <b>
              {item.translations?.find((translation) => translation.locale === "uz")?.title ||
                "Nomsiz qoralama"}
            </b>
            <small>{item.cadastralNumber || "Kadastr kiritilmagan"}</small>
          </span>
        ),
      },
      {
        id: "district",
        header: "Joylashuv",
        cell: (item) => item.district || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (item) => <span className={`admin-status ${item.status}`}>{item.status}</span>,
      },
      {
        id: "media",
        header: "Media",
        align: "center",
        cell: (item) => item.media?.length || 0,
      },
      {
        id: "actions",
        header: "",
        align: "right",
        cell: (item) => (
          <div className="admin-table-actions">
            <Link aria-label="Tahrirlash" href={`/dashboard/projects/${item.id}/edit`}>
              <PencilLine size={17} />
            </Link>
            {item.status !== "archived" && (
              <button aria-label="Arxivlash" type="button" onClick={() => archive(item.id)}>
                <Archive size={17} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [archive],
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
      <label className="admin-topbar-search">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Nomi, tuman yoki kadastr"
        />
      </label>
      <select
        className="admin-topbar-select"
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
      >
        <option value="">Barcha statuslar</option>
        {statuses.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <Link className="admin-primary admin-topbar-create" href="/dashboard/projects/new">
        <Plus size={17} /> Yangi obyekt
      </Link>
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
        emptyState={<p>Mos obyekt topilmadi.</p>}
      />
      <ServerPagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        pageSize={meta.limit}
        totalItems={meta.total}
        onPageChange={setPage}
        onPageSizeChange={updatePageSize}
      />
    </section>
  );
}
