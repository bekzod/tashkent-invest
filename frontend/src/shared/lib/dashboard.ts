import type { InvestmentObject } from '@/entities/investment-object/types';
import type { MessageKey } from '@/shared/i18n/messages';

export type DashboardSection =
  | 'overview'
  | 'map'
  | 'projects'
  | 'applications'
  | 'favorites'
  | 'profile'
  | 'settings';

export function formatInvestmentAmount(value: number, locale: 'uz' | 'ru' = 'uz') {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} ${locale === 'ru' ? 'млрд' : 'mlrd'}`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} ${locale === 'ru' ? 'млн' : 'mln'}`;
  return `$${value.toLocaleString('en-US')}`;
}

export function projectAreaLabel(project: InvestmentObject) {
  const area = project.landAreaHa ?? project.buildingAreaSqm;
  if (area == null) return '—';
  return `${area} ${project.landAreaHa != null ? 'ga' : 'm²'}`;
}

export function statusMessageKey(status: string): MessageKey | undefined {
  const keys: Record<string, MessageKey> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    draft: 'draft',
    available: 'available',
    auction: 'auction',
    upcoming: 'upcoming',
    archived: 'archived',
  };
  return keys[status];
}

export function dashboardSectionMessageKey(section: DashboardSection): MessageKey {
  const keys: Record<DashboardSection, MessageKey> = {
    overview: 'dashboardHome',
    map: 'investmentMap',
    projects: 'projects',
    applications: 'applications',
    favorites: 'watched',
    profile: 'profile',
    settings: 'settings',
  };
  return keys[section];
}
