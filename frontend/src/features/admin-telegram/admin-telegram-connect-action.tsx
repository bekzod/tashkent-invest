"use client";

import { CheckCircle2, ExternalLink, MessageCircleMore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/shared/api/client";
import { useLanguage } from "@/shared/i18n/language-provider";

type TelegramStatus = {
  linked: boolean;
};

type TelegramLink = {
  botUrl: string;
};

function isTelegramBotUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "t.me" || url.hostname === "telegram.me");
  } catch {
    return false;
  }
}

export function AdminTelegramConnectAction() {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setStatus(await api<TelegramStatus>("/admin/telegram", {}, locale));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function handleClick() {
    if (!status) return;

    if (status?.linked) {
      router.push("/dashboard/settings");
      return;
    }

    setLinking(true);
    setError(false);
    try {
      const response = await api<TelegramLink>("/admin/telegram/link", { method: "POST" }, locale);
      if (!isTelegramBotUrl(response.botUrl)) throw new Error("Unsafe Telegram bot URL");
      window.open(response.botUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError(true);
    } finally {
      setLinking(false);
    }
  }

  const linked = status?.linked === true;
  const label = linked ? t("telegramConnected") : linking ? t("telegramOpening") : t("telegramConnect");

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button variant={linked ? "outline" : "default"} disabled={loading || linking || !status} onClick={() => void handleClick()}>
        {linked ? <CheckCircle2 size={17} aria-hidden="true" /> : loading ? <MessageCircleMore size={17} aria-hidden="true" /> : <ExternalLink size={17} aria-hidden="true" />}
        {label}
      </Button>
      {error ? <p className="text-xs text-destructive" role="alert">{t("telegramConnectionStartFailed")}</p> : null}
    </div>
  );
}
