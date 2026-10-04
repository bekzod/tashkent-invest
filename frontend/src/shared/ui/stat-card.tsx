import type { ComponentType, HTMLAttributes } from "react";
import type { LucideProps } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string | number;
  icon: ComponentType<LucideProps>;
  loading?: boolean;
  detail?: string;
};

export function StatCard({ label, value, icon: Icon, loading = false, detail, className, ...props }: StatCardProps) {
  return (
    <Card className={cn("min-h-28 shadow-[var(--ds-shadow-card)]", className)} {...props}>
      <CardContent className="flex h-full items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="m-0 text-sm text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-7 w-20" /> : <strong className="mt-1 block text-xl font-bold">{value}</strong>}
          {detail ? <small className="mt-1 block text-xs text-muted-foreground">{detail}</small> : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary" aria-hidden="true">
          <Icon size={18} />
        </span>
      </CardContent>
    </Card>
  );
}
