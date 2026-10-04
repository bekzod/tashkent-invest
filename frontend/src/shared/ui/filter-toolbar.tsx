import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FilterToolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2 shadow-sm",
        className,
      )}
      role="search"
      {...props}
    />
  );
}
