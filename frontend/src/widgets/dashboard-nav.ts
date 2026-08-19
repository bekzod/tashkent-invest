import type { LucideIcon } from 'lucide-react';
import { Bookmark, Building2, ClipboardList, Grid2X2, LayoutPanelTop, Map, Plus, Settings } from 'lucide-react';
import type { DashboardSection } from '@/shared/lib/dashboard';

export type DashboardNavEntry = {
  href: string;
  icon: LucideIcon;
  label: string;
  section: DashboardSection;
};

export type DashboardRole = 'investor' | 'admin';

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

const adminDashboardNavigation: DashboardNavEntry[] = [
  { icon: Grid2X2, href: '/dashboard', label: 'Boshqaruv paneli', section: 'overview' },
  { icon: Building2, href: '/dashboard/projects', label: 'Obyektlar', section: 'projects' },
];

export function getDashboardNavigation(role: DashboardRole) {
  return role === 'admin' ? adminDashboardNavigation : dashboardNavigation;
}

export function getDashboardPrimaryAction(role: DashboardRole) {
  return role === 'admin'
    ? { href: '/dashboard/projects/new', label: 'Yangi obyekt', icon: Plus }
    : { href: '/dashboard/map', label: 'Yangi loyihani topish', icon: Plus };
}
