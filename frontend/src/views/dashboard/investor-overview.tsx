"use client";

import Link from "next/link";
import { Bell, Building2, ChevronRight, FileClock, Search, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { localizedPath } from "@/shared/i18n/routing";
import { formatInvestmentAmount } from "@/shared/lib/dashboard";
import { notify } from "@/shared/ui/feedback";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { StatCard } from "@/shared/ui/stat-card";
import { StatusBadge } from "@/shared/ui/status-badge";
import { DashboardObjectGrid } from "./object-grid";
import { localizedStatus, statusTone } from "./helpers";
import type { DashboardStatistics, InvestorApplication, ObjectResponse } from "./types";

export function InvestorOverview() {
  const { locale, t } = useLanguage();
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [projects, setProjects] = useState<ObjectResponse["items"]>([]);
  const [applications, setApplications] = useState<InvestorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFailed(false);
    const results = await Promise.allSettled([
      api<DashboardStatistics>("/statistics", { signal }, locale),
      api<ObjectResponse>("/objects?limit=4", { signal }, locale),
      api<{ items: InvestorApplication[] }>("/me/applications", { signal }, locale),
    ]);
    if (signal?.aborted) return;
    const [statsResult, objectsResult, applicationsResult] = results;
    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    if (objectsResult.status === "fulfilled") setProjects(objectsResult.value.items);
    if (applicationsResult.status === "fulfilled") setApplications(applicationsResult.value.items);
    const failures = results.filter((result) => result.status === "rejected").length;
    if (failures) notify.warning(t("loadPartialWarning"));
    setFailed(failures === results.length);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => void load(controller.signal));
    return () => controller.abort();
  }, [load]);

  const metrics = useMemo(() => [
    { label: t("availableObjects"), value: stats?.objects ?? "—", icon: Building2 },
    { label: t("myApplications"), value: applications.length, icon: FileClock },
    { label: t("auctionLots"), value: stats?.auctions ?? "—", icon: Bell },
    { label: t("investmentAmount"), value: stats ? formatInvestmentAmount(stats.investmentAmountUsd, locale) : "—", icon: TrendingUp },
  ], [applications.length, locale, stats, t]);

  return (
    <PageLayout>
      <PageHeader title={t("dashboardHome")} description={t("findOpportunityText")} actions={<Button asChild><Link href="/dashboard/map"><Search size={17} />{t("searchProjects")}</Link></Button>} />
      {failed ? <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} /> : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("mainSection")}>
            {metrics.map((metric) => <StatCard key={metric.label} {...metric} loading={loading} />)}
          </section>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
            <Card className="shadow-[var(--ds-shadow-card)]">
              <CardHeader className="flex-row items-center justify-between p-4"><CardTitle>{t("recentApplications")}</CardTitle><Button asChild variant="link"><Link href="/dashboard/applications">{t("seeAll")}<ChevronRight size={15} /></Link></Button></CardHeader>
              <CardContent className="p-0">
                {applications.length ? <div className="divide-y divide-border">{applications.slice(0, 4).map((item) => <Link className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-accent" href={localizedPath(locale, `/objects/${item.object.slug}`)} key={item.id}><span className="grid size-8 place-items-center rounded-md bg-secondary text-primary"><FileClock size={16} /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{item.object.title}</b><small className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ")}</small></span><StatusBadge tone={statusTone(item.status)}>{localizedStatus(item.status, t)}</StatusBadge></Link>)}</div> : !loading ? <EmptyState className="m-4 min-h-40" title={t("noApplicationsYet")} action={<Button asChild variant="outline"><Link href="/dashboard/map">{t("viewObjects")}</Link></Button>} /> : null}
              </CardContent>
            </Card>
            <Card className="shadow-[var(--ds-shadow-card)]"><CardHeader className="p-4"><CardTitle>{t("startInvesting")}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><ol className="grid gap-3 text-sm"><li>1. {t("guideChooseObject")}</li><li>2. {t("guideStudyTerms")}</li><li>3. {t("guideSubmitApplication")}</li></ol><Button asChild className="mt-4 w-full"><Link href="/dashboard/map">{t("startProcess")}</Link></Button></CardContent></Card>
          </div>
          <Card className="shadow-[var(--ds-shadow-card)]"><CardHeader className="flex-row items-center justify-between p-4"><CardTitle>{t("recommendedObjects")}</CardTitle><Button asChild variant="link"><Link href="/dashboard/projects">{t("seeAll")}<ChevronRight size={15} /></Link></Button></CardHeader><CardContent className="p-4 pt-0">{projects.length || loading ? <DashboardObjectGrid items={projects} loading={loading} /> : <EmptyState title={t("projectsUnavailable")} action={<Button asChild variant="outline"><Link href="/dashboard/map">{t("openMap")}</Link></Button>} />}</CardContent></Card>
        </>
      )}
    </PageLayout>
  );
}
