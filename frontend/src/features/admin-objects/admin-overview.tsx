"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, ClipboardPenLine, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminObjectsApi } from "./api";
import type { AdminObject } from "./types";
import { useLanguage } from "@/shared/i18n/language-provider";
import { notify } from "@/shared/ui/feedback";

export function AdminOverview() {
  const { t } = useLanguage();
  const [items, setItems] = useState<AdminObject[]>([]);
  useEffect(() => {
    void adminObjectsApi.list()
      .then((value) => setItems(value.items))
      .catch(() => notify.error(t("requestFailed")));
  }, [t]);
  const metrics = useMemo(
    () => [
      { label: t("totalObjects"), value: items.length, icon: Building2 },
      {
        label: t("published"),
        value: items.filter((item) =>
          ["available", "auction", "upcoming"].includes(item.status),
        ).length,
        icon: Eye,
      },
      {
        label: t("drafts"),
        value: items.filter((item) => item.status === "draft").length,
        icon: ClipboardPenLine,
      },
    ],
    [items, t],
  );
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <Button asChild className="admin-primary"><Link href="/dashboard/projects/new"><Plus size={17} /> {t("addNewObject")}</Link></Button>
      </header>
      <div className="admin-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="admin-metric-card">
            <CardContent>
            <span>
              <Icon size={20} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
            </CardContent>
          </Card>
        ))}
      </div>
      <section className="admin-start-card">
        <p>{t("adminStartText")}</p>
        <Button asChild className="admin-primary"><Link href="/dashboard/projects/new">{t("addObject")}</Link></Button>
      </section>
    </section>
  );
}
