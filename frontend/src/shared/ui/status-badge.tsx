import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  info: "border-[var(--ds-info)]/20 bg-[var(--ds-info-soft)] text-[var(--ds-info)]",
  success: "border-[var(--ds-success)]/20 bg-[var(--ds-success-soft)] text-[var(--ds-success)]",
  warning: "border-[var(--ds-warning)]/20 bg-[var(--ds-warning-soft)] text-[var(--ds-warning)]",
  danger: "border-[var(--ds-danger)]/20 bg-[var(--ds-danger-soft)] text-[var(--ds-danger)]",
};

export function StatusBadge({ tone = "neutral", className, ...props }: ComponentProps<typeof Badge> & { tone?: StatusTone }) {
  return <Badge variant="outline" className={cn("gap-1 rounded-full font-bold", toneClass[tone], className)} data-tone={tone} {...props} />;
}
