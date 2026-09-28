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

export function projectAreaLabel(project: InvestmentObject, locale: 'uz' | 'ru' = 'uz') {
  const area = project.landAreaHa ?? project.buildingAreaSqm;
  if (area == null) return '—';
  const formatted = area.toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ');
  return `${formatted} ${project.landAreaHa != null ? (locale === 'ru' ? 'га' : 'ga') : 'm²'}`;
}

export function pluralMessageKey(
  count: number,
  locale: 'uz' | 'ru',
  kind: 'object' | 'activeFilter',
): MessageKey {
  const form = locale === 'uz'
    ? 'Many'
    : count % 10 === 1 && count % 100 !== 11
      ? 'One'
      : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)
        ? 'Few'
        : 'Many';
  return `${kind}${form}` as MessageKey;
}

export function statusMessageKey(status: string): MessageKey | undefined {
  const keys: Record<string, MessageKey> = {
    received: 'received',
    in_review: 'inReview',
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
