import { MapPageClient } from "@/features/investment-map/map-page-client";
import { PageLayout } from "@/shared/ui/page-layout";

export function DashboardMap() {
  return (
    <PageLayout workspace className="dashboard-route-map">
      <div className="dashboard-map-frame"><MapPageClient /></div>
    </PageLayout>
  );
}
