"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { InvestmentObject } from "@/entities/investment-object/types";
import { Button } from "@/components/ui/button";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";
import { DashboardObjectGrid } from "./object-grid";

export function InvestorFavorites() {
  const { locale, t } = useLanguage();
  const [items, setItems] = useState<InvestmentObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await api<{ items: InvestmentObject[] }>("/me/favorites", { signal }, locale);
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
      <PageHeader title={t("watched")} description={t("findOpportunityText")} actions={<Button asChild><Link href="/dashboard/map">{t("chooseFromMap")}</Link></Button>} />
      {error ? (
        <ErrorState title={t("dataLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} />
      ) : items.length || loading ? (
        <DashboardObjectGrid items={items} loading={loading} />
      ) : (
        <EmptyState icon={Bookmark} title={t("noFavorites")} action={<Button asChild variant="outline"><Link href="/dashboard/map">{t("chooseFromMap")}</Link></Button>} />
      )}
    </PageLayout>
  );
}
