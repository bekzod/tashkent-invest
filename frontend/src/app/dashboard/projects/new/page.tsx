import { AdminDashboardGuard } from '@/features/admin-objects/admin-dashboard-guard';
import { ObjectEditor } from '@/features/admin-objects/object-editor';

export default function NewDashboardObjectPage() {
  return <AdminDashboardGuard activeSection="projects"><ObjectEditor /></AdminDashboardGuard>;
}
