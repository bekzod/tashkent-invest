import type { InvestmentObject } from "@/entities/investment-object/types";
import { ObjectCard } from "@/entities/investment-object/object-card";
import { DashboardGridSkeleton } from "@/shared/ui/dashboard-loading";

export function DashboardObjectGrid({ items, loading = false, loadingLabel }: { items: InvestmentObject[]; loading?: boolean; loadingLabel?: string }) {
  if (loading) return <DashboardGridSkeleton label={loadingLabel} />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => <ObjectCard key={item.id} object={item} />)}
    </div>
  );
}
