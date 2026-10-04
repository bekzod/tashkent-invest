import type { InvestmentObject } from "@/entities/investment-object/types";
import { ObjectCard } from "@/entities/investment-object/object-card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardObjectGrid({ items, loading = false }: { items: InvestmentObject[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }, (_, index) => <Skeleton className="h-72 w-full" key={index} />)
        : items.map((item) => <ObjectCard key={item.id} object={item} />)}
    </div>
  );
}
