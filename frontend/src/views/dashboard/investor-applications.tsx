"use client";

import Link from "next/link";
import { ClipboardList, FileClock, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { DashboardListSkeleton } from "@/shared/ui/dashboard-loading";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { StatusBadge } from "@/shared/ui/status-badge";
import { localizedStatus, statusTone } from "./helpers";
import type { InvestorApplication } from "./types";

export function InvestorApplications() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<InvestorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await api<{ items: InvestorApplication[] }>("/me/applications", { signal }, locale);
      if (signal?.aborted) return;
      setItems(response.items);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void load(controller.signal));
    return () => controller.abort();
  }, [load]);

  return (
    <PageLayout>
      <PageHeader
        title={t("allApplications")}
        description={t("findOpportunityText")}
        actions={<Button asChild><Link href="/dashboard/map"><Plus size={17} />{t("newApplication")}</Link></Button>}
      />
      {error ? (
        <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} />
      ) : loading ? (
        <DashboardListSkeleton label={t("dashboardLoading")} rows={4} />
      ) : items.length ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {items.map((item) => (
              <Link
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                href={localizedPath(locale, `/objects/${item.object.slug}`)}
                key={item.id}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary"><FileClock size={17} /></span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{item.object.title}</b>
                  <small className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ")}</small>
                </span>
                <StatusBadge tone={statusTone(item.status)}>{localizedStatus(item.status, t)}</StatusBadge>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={t("noApplicationsSubmitted")}
          action={<Button asChild variant="outline"><Link href="/dashboard/map">{t("viewObjects")}</Link></Button>}
        />
      )}
    </PageLayout>
  );
}
