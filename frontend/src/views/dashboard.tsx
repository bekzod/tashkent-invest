"use client";

import type { DashboardSection } from "@/shared/lib/dashboard";
import { useLanguage } from "@/shared/i18n/language-provider";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { AdminApplications } from "@/features/admin-applications/admin-applications";
import { AdminObjectsList } from "@/features/admin-objects/admin-objects-list";
import { AdminOverview } from "@/features/admin-objects/admin-overview";
import { DashboardMap } from "./dashboard/dashboard-map";
import { InvestorApplications } from "./dashboard/investor-applications";
import { InvestorFavorites } from "./dashboard/investor-favorites";
import { InvestorOverview } from "./dashboard/investor-overview";
import { InvestorProfile } from "./dashboard/investor-profile";
import { InvestorProjects } from "./dashboard/investor-projects";
import { InvestorSettings } from "./dashboard/investor-settings";
import { useDashboardSession } from "./dashboard/use-dashboard-session";

export function DashboardView({ activeSection = "overview" }: { activeSection?: DashboardSection }) {
  const { t } = useLanguage();
  const session = useDashboardSession();

  if (!session) return <main className="dashboard-route-page">{t("dashboardLoading")}</main>;

  if (session.user.role === "admin") {
    return (
      <DashboardShell activeSection={activeSection} role="admin" session={session}>
        {activeSection === "projects" ? <AdminObjectsList /> : null}
        {activeSection === "applications" ? <AdminApplications /> : null}
        {activeSection === "map" ? <DashboardMap /> : null}
        {!['projects', 'applications', 'map'].includes(activeSection) ? <AdminOverview /> : null}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell activeSection={activeSection} role="investor" session={session}>
      {activeSection === "overview" ? <InvestorOverview /> : null}
      {activeSection === "map" ? <DashboardMap /> : null}
      {activeSection === "projects" ? <InvestorProjects /> : null}
      {activeSection === "applications" ? <InvestorApplications /> : null}
      {activeSection === "favorites" ? <InvestorFavorites /> : null}
      {activeSection === "profile" ? <InvestorProfile session={session} /> : null}
      {activeSection === "settings" ? <InvestorSettings /> : null}
    </DashboardShell>
  );
}
