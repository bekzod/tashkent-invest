import type { HTMLAttributes, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action, className, ...props }: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center gap-3 rounded-md border border-destructive/25 bg-destructive/5 p-6 text-center", className)} role="alert" {...props}>
      <TriangleAlert className="text-destructive" size={24} aria-hidden="true" />
      <div><h2 className="m-0 text-base font-bold">{title}</h2>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
