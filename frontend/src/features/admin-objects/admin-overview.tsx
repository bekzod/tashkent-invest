"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, ClipboardPenLine, Eye, Plus } from "lucide-react";
import { adminObjectsApi } from "./api";
import type { AdminObject } from "./types";

export function AdminOverview() {
  const [items, setItems] = useState<AdminObject[]>([]);
  useEffect(() => {
    void adminObjectsApi.list().then((value) => setItems(value.items));
  }, []);
  const metrics = useMemo(
    () => [
      { label: "Jami obyektlar", value: items.length, icon: Building2 },
      {
        label: "Nashr qilingan",
        value: items.filter((item) =>
          ["available", "auction", "upcoming"].includes(item.status),
        ).length,
        icon: Eye,
      },
      {
        label: "Qoralamalar",
        value: items.filter((item) => item.status === "draft").length,
        icon: ClipboardPenLine,
      },
    ],
    [items],
  );
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <Link className="admin-primary" href="/dashboard/projects/new">
          <Plus size={17} /> Yangi obyekt qo‘shish
        </Link>
      </header>
      <div className="admin-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label}>
            <span>
              <Icon size={20} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="admin-start-card">
        <p>Asosiy ma’lumotni kiriting, xaritada nuqtani belgilang, media va hujjatlarni qo‘shib nashr qiling.</p>
        <Link className="admin-primary" href="/dashboard/projects/new">
          Obyekt qo‘shish
        </Link>
      </section>
    </section>
  );
}
