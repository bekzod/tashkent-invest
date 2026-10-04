"use client";

import { Mail, ShieldCheck, UserRound } from "lucide-react";
import type { Session } from "@/shared/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/shared/i18n/language-provider";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";

export function InvestorProfile({ session }: { session: Session }) {
  const { t } = useLanguage();
  const userName = session.user.name || t("investorDefaultName");

  return (
    <PageLayout>
      <PageHeader title={t("profile")} description={t("nameEmailPhone")} />
      <Card className="max-w-3xl">
        <CardHeader className="flex-row items-center gap-3 border-b border-border p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground">
            {userName.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">{userName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("investorAccount")}</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-0 p-0">
          <div className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3">
            <UserRound className="text-muted-foreground" size={18} />
            <div><p className="text-xs font-medium text-muted-foreground">{t("name")}</p><p className="text-sm font-semibold">{userName}</p></div>
          </div>
          <div className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3">
            <Mail className="text-muted-foreground" size={18} />
            <div><p className="text-xs font-medium text-muted-foreground">{t("email")}</p><p className="text-sm font-semibold">{session.user.email}</p></div>
          </div>
          <div className="flex min-h-16 items-center gap-3 px-4 py-3">
            <ShieldCheck className="text-muted-foreground" size={18} />
            <div><p className="text-xs font-medium text-muted-foreground">{t("profileInformation")}</p><p className="text-sm font-semibold">{t("investorAccount")}</p></div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
