"use client";

import Link from "next/link";
import { ChevronRight, Languages, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/shared/i18n/language-provider";
import type { Locale } from "@/shared/i18n/routing";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";

export function InvestorSettings() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <PageLayout>
      <PageHeader title={t("settings")} />
      <Card className="max-w-3xl">
        <CardContent className="divide-y divide-border p-0">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Languages size={18} /></span>
            <div className="min-w-40 flex-1"><p className="text-sm font-semibold">{t("language")}</p><p className="text-xs text-muted-foreground">O‘zbekcha / Русский</p></div>
            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger className="w-36" aria-label={t("language")}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="uz">O‘zbekcha</SelectItem><SelectItem value="ru">Русский</SelectItem></SelectContent>
            </Select>
          </div>
          <Link className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent" href="/dashboard/profile">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary"><UserRound size={18} /></span>
            <span className="min-w-0 flex-1"><b className="block text-sm">{t("profileInformation")}</b><small className="text-xs text-muted-foreground">{t("nameEmailPhone")}</small></span>
            <ChevronRight className="text-muted-foreground" size={18} />
          </Link>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
