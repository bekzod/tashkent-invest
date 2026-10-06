"use client";

import type { DashboardSection } from "@/shared/lib/dashboard";
import { useLanguage } from "@/shared/i18n/language-provider";
import {
  DashboardLoadingShell,
  dashboardLoadingPreset,
} from "@/shared/ui/dashboard-loading";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { AdminApplications } from "@/features/admin-applications/admin-applications";
import { AdminObjectsList } from "@/features/admin-objects/admin-objects-list";
import { AdminOverview } from "@/features/admin-objects/admin-overview";
import { AdminTelegramSettings } from "@/features/admin-telegram/admin-telegram-settings";
import { DashboardMap } from "./dashboard/dashboard-map";
import { InvestorApplications } from "./dashboard/investor-applications";
import { InvestorFavorites } from "./dashboard/investor-favorites";
import { InvestorOverview } from "./dashboard/investor-overview";
import { InvestorProfile } from "./dashboard/investor-profile";
import { InvestorProjects } from "./dashboard/investor-projects";
import { InvestorSettings } from "./dashboard/investor-settings";
import { useDashboardSession } from "./dashboard/use-dashboard-session";

export function DashboardView({
  activeSection = "overview",
  applicationId,
}: {
  activeSection?: DashboardSection;
  applicationId?: string;
}) {
  const { t } = useLanguage();
  const session = useDashboardSession();

  if (!session) {
    return <DashboardLoadingShell label={t("dashboardLoading")} preset={dashboardLoadingPreset(activeSection)} />;
  }

  if (session.user.role === "admin") {
    return (
      <DashboardShell activeSection={activeSection} role="admin" session={session}>
        {activeSection === "projects" ? <AdminObjectsList /> : null}
        {activeSection === "applications" ? <AdminApplications applicationId={applicationId} /> : null}
        {activeSection === "settings" ? <AdminTelegramSettings /> : null}
        {activeSection === "map" ? <DashboardMap /> : null}
        {!['projects', 'applications', 'settings', 'map'].includes(activeSection) ? <AdminOverview /> : null}
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
