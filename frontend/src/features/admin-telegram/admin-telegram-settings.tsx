"use client";

import { CheckCircle2, ExternalLink, MessageCircleMore, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { PageLayout } from "@/shared/ui/page-layout";

type TelegramStatus = {
  linked: boolean;
  linkedAt: string | null;
};

type TelegramLink = {
  botUrl: string;
  expiresAt: string;
};

function isTelegramBotUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "t.me" || url.hostname === "telegram.me");
  } catch {
    return false;
  }
}

export function AdminTelegramSettings() {
  const { locale, t } = useLanguage();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [linking, setLinking] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await api<TelegramStatus>("/admin/telegram", {}, locale);
      setStatus(response);
      if (response.linked) setAwaitingConfirmation(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (awaitingConfirmation) void load();
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [awaitingConfirmation, load]);

  async function startLink() {
    setLinking(true);
    try {
      const response = await api<TelegramLink>("/admin/telegram/link", { method: "POST" }, locale);
      if (!isTelegramBotUrl(response.botUrl)) throw new Error("Unsafe Telegram bot URL");
      window.open(response.botUrl, "_blank", "noopener,noreferrer");
      setAwaitingConfirmation(true);
    } catch {
      setLoadError(true);
    } finally {
      setLinking(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader title={t("settings")} description={t("telegramNotificationsDescription")} />
      {loadError && !status ? (
        <ErrorState title={t("telegramConnectionLoadFailed")} action={<Button variant="outline" onClick={() => void load()}>{t("retry")}</Button>} />
      ) : loading || !status ? (
        <Card className="max-w-3xl"><CardContent className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">{t("loading")}</CardContent></Card>
      ) : status.linked ? (
        <ConnectedTelegram linkedAt={status.linkedAt} />
      ) : (
        <Card className="max-w-3xl overflow-hidden">
          <CardHeader className="border-b border-border bg-secondary/30">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><MessageCircleMore size={22} aria-hidden="true" /></span>
              <div className="min-w-0"><CardTitle>{t("telegramNotConnected")}</CardTitle><CardDescription className="mt-1">{t("telegramNotConnectedDescription")}</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <ol className="grid gap-3" aria-label={t("telegramNotifications")}>
              <Step number={1} title={t("telegramConnectStepOne")} />
              <Step number={2} title={t("telegramConnectStepTwo")} />
            </ol>
            {awaitingConfirmation ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200">{t("telegramAwaitingConfirmation")}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button disabled={linking} onClick={() => void startLink()}><ExternalLink size={17} />{linking ? t("telegramOpening") : t("telegramConnect")}</Button>
              {awaitingConfirmation ? <Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw size={17} />{t("telegramCheckConnection")}</Button> : null}
            </div>
            {loadError ? <p className="text-sm text-destructive" role="alert">{t("telegramConnectionStartFailed")}</p> : null}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}

function ConnectedTelegram({ linkedAt }: { linkedAt: string | null }) {
  const { locale, t } = useLanguage();
  const formattedLinkedAt = linkedAt
    ? new Date(linkedAt).toLocaleString(locale === "ru" ? "ru-RU" : "uz-UZ")
    : null;

  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={25} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-bold">{t("telegramConnected")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("telegramConnectedDescription")}</p>{formattedLinkedAt ? <p className="mt-2 text-xs text-muted-foreground">{formattedLinkedAt}</p> : null}</div>
        <ShieldCheck className="shrink-0 text-emerald-700" size={24} aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

function Step({ number, title }: { number: number; title: string }) {
  return <li className="flex items-center gap-3 text-sm"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary">{number}</span><span>{title}</span></li>;
}
