import type { MessageKey } from "@/shared/i18n/messages";
import { statusMessageKey } from "@/shared/lib/dashboard";
import type { StatusTone } from "@/shared/ui/status-badge";

export function localizedStatus(status: string, t: (key: MessageKey) => string) {
  const key = statusMessageKey(status);
  return key ? t(key) : status;
}

export function statusTone(status: string): StatusTone {
  if (["approved", "available"].includes(status)) return "success";
  if (["rejected", "archived"].includes(status)) return "danger";
  if (["auction", "upcoming", "in_review", "pending"].includes(status)) return "warning";
  if (status === "received") return "info";
  return "neutral";
}
