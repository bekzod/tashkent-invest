import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<LucideProps>;
};

export function EmptyState({ title, description, action, icon: Icon = Inbox, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border p-6 text-center", className)} {...props}>
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true"><Icon size={21} /></span>
      <div>
        <h2 className="m-0 text-base font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
