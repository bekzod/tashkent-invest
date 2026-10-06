"use client";

import Link from "next/link";
import { Building2, ClipboardPenLine, Eye, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/shared/i18n/language-provider";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { StatCard } from "@/shared/ui/stat-card";
import { AdminTelegramConnectAction } from "@/features/admin-telegram/admin-telegram-connect-action";
import { adminObjectsApi } from "./api";

type Metrics = { total: number; published: number; drafts: number };

export function AdminOverview() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState<Metrics>({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [all, drafts, available, auctions, upcoming] = await Promise.all([
        adminObjectsApi.list({ limit: 1 }),
        adminObjectsApi.list({ limit: 1, status: "draft" }),
        adminObjectsApi.list({ limit: 1, status: "available" }),
        adminObjectsApi.list({ limit: 1, status: "auction" }),
        adminObjectsApi.list({ limit: 1, status: "upcoming" }),
      ]);
      setCounts({
        total: all.meta.total,
        published: available.meta.total + auctions.meta.total + upcoming.meta.total,
        drafts: drafts.meta.total,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const metrics = [
    { label: t("totalObjects"), value: counts.total, icon: Building2 },
    { label: t("published"), value: counts.published, icon: Eye },
    { label: t("drafts"), value: counts.drafts, icon: ClipboardPenLine },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t("managementDashboard")}
        description={t("adminStartText")}
        actions={<div className="flex flex-wrap items-start gap-2"><AdminTelegramConnectAction /><Button asChild><Link href="/dashboard/projects/new"><Plus size={17} />{t("addNewObject")}</Link></Button></div>}
      />
      {error ? (
        <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label={t("mainSection")}>
            {metrics.map((metric) => <StatCard key={metric.label} {...metric} loading={loading} />)}
          </section>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t("adminStartText")}</p>
              <Button asChild variant="outline"><Link href="/dashboard/projects/new"><Plus size={17} />{t("addObject")}</Link></Button>
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
