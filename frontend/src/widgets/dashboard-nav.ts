import type { LucideIcon } from 'lucide-react';
import { Bookmark, ClipboardList, Grid2X2, LayoutPanelTop, Map, Settings } from 'lucide-react';
import type { DashboardSection } from '@/shared/lib/dashboard';

export type DashboardNavEntry = {
  href: string;
  icon: LucideIcon;
  label: string;
  section: DashboardSection;
};

export const dashboardNavigation: DashboardNavEntry[] = [
  { icon: Grid2X2, href: '/dashboard', label: 'Bosh sahifa', section: 'overview' },
  { icon: Map, href: '/dashboard/map', label: 'Investitsiya xaritasi', section: 'map' },
  { icon: LayoutPanelTop, href: '/dashboard/projects', label: 'Loyihalar', section: 'projects' },
  { icon: ClipboardList, href: '/dashboard/applications', label: 'Arizalarim', section: 'applications' },
  { icon: Bookmark, href: '/dashboard/favorites', label: 'Kuzatuvdagilar', section: 'favorites' },
];

export const dashboardSettingsEntry: DashboardNavEntry = {
  icon: Settings,
  href: '/dashboard/settings',
  label: 'Sozlamalar',
  section: 'settings',
};
