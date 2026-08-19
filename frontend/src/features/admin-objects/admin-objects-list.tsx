"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, PencilLine, Archive } from "lucide-react";
import { adminObjectsApi } from "./api";
import type { AdminObject } from "./types";

export function AdminObjectsList() {
  const [items, setItems] = useState<AdminObject[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminObjectsApi
      .list()
      .then((value) => setItems(value.items))
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!status || item.status === status) &&
          `${item.slug || ""} ${item.district || ""} ${item.cadastralNumber || ""} ${item.translations?.[0]?.title || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status],
  );
  const archive = async (id: string) => {
    if (
      !window.confirm(
        "Obyekt investorlar xaritasidan olib tashlanadi. Davom etilsinmi?",
      )
    )
      return;
    await adminObjectsApi.archive(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "archived" } : item,
      ),
    );
  };
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>OBYEKTLAR BOSHQARUVI</p>
          <h1>Investitsiya obyektlari</h1>
        </div>
        <Link className="admin-primary" href="/admin/objects/new">
          <Plus size={17} /> Yangi obyekt
        </Link>
      </header>
      <div className="admin-toolbar">
        <label>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nomi, tuman yoki kadastr"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Barcha statuslar</option>
          {["draft", "available", "auction", "upcoming", "archived"].map(
            (value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="admin-table-card">
        <table>
          <thead>
            <tr>
              <th>Obyekt</th>
              <th>Joylashuv</th>
              <th>Status</th>
              <th>Media</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Yuklanmoqda…</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>
                      {item.translations?.find(
                        (translation) => translation.locale === "uz",
                      )?.title || "Nomsiz qoralama"}
                    </b>
                    <small>
                      {item.cadastralNumber || "Kadastr kiritilmagan"}
                    </small>
                  </td>
                  <td>{item.district || "—"}</td>
                  <td>
                    <span className={`admin-status ${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.media?.length || 0}</td>
                  <td>
                    <Link
                      aria-label="Tahrirlash"
                      href={`/admin/objects/${item.id}/edit`}
                    >
                      <PencilLine size={17} />
                    </Link>
                    {item.status !== "archived" && (
                      <button
                        aria-label="Arxivlash"
                        onClick={() => archive(item.id)}
                      >
                        <Archive size={17} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && !filtered.length && (
          <p className="admin-empty">Mos obyekt topilmadi.</p>
        )}
      </div>
    </section>
  );
}
