import { DashboardView } from '@/views/dashboard';

type DashboardApplicationsPageProps = {
  searchParams: Promise<{ application?: string | string[] }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function DashboardApplicationsPage({
  searchParams,
}: DashboardApplicationsPageProps) {
  const query = await searchParams;
  const application = Array.isArray(query.application)
    ? query.application[0]
    : query.application;
  const applicationId = application && uuidPattern.test(application)
    ? application
    : undefined;

  return <DashboardView activeSection="applications" applicationId={applicationId} />;
}
