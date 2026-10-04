import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type PageLayoutProps = HTMLAttributes<HTMLElement> & {
  workspace?: boolean;
};

export function PageLayout({ className, workspace = false, ...props }: PageLayoutProps) {
  return (
    <main
      className={cn(
        "flex min-w-0 flex-col gap-[var(--ds-section-gap)] px-[var(--ds-page-gutter)] py-[var(--ds-page-y)]",
        workspace && "h-full overflow-hidden p-0",
        className,
      )}
      data-workspace={workspace || undefined}
      {...props}
    />
  );
}
