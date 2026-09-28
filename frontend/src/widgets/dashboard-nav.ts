import type { LucideIcon } from 'lucide-react';
import { Bookmark, Building2, ClipboardList, Grid2X2, LayoutPanelTop, Map, Plus, Settings } from 'lucide-react';
import type { DashboardSection } from '@/shared/lib/dashboard';
import type { MessageKey } from '@/shared/i18n/messages';

export type DashboardNavEntry = {
  href: string;
  icon: LucideIcon;
  labelKey: MessageKey;
  section: DashboardSection;
};

export type DashboardRole = 'investor' | 'admin';

export const dashboardNavigation: DashboardNavEntry[] = [
  { icon: Grid2X2, href: '/dashboard', labelKey: 'dashboardHome', section: 'overview' },
  { icon: Map, href: '/dashboard/map', labelKey: 'investmentMap', section: 'map' },
  { icon: LayoutPanelTop, href: '/dashboard/projects', labelKey: 'projects', section: 'projects' },
  { icon: ClipboardList, href: '/dashboard/applications', labelKey: 'applications', section: 'applications' },
  { icon: Bookmark, href: '/dashboard/favorites', labelKey: 'watched', section: 'favorites' },
];

export const dashboardSettingsEntry: DashboardNavEntry = {
  icon: Settings,
  href: '/dashboard/settings',
  labelKey: 'settings',
  section: 'settings',
};

const adminDashboardNavigation: DashboardNavEntry[] = [
  { icon: Grid2X2, href: '/dashboard', labelKey: 'managementDashboard', section: 'overview' },
  { icon: Building2, href: '/dashboard/projects', labelKey: 'objectsBack', section: 'projects' },
  { icon: ClipboardList, href: '/dashboard/applications', labelKey: 'adminApplications', section: 'applications' },
];

export function getDashboardNavigation(role: DashboardRole) {
  return role === 'admin' ? adminDashboardNavigation : dashboardNavigation;
}

export function getDashboardPrimaryAction(role: DashboardRole) {
  return role === 'admin'
    ? { href: '/dashboard/projects/new', labelKey: 'newObject' as const, icon: Plus }
    : { href: '/dashboard/map', labelKey: 'findNewProject' as const, icon: Plus };
}
