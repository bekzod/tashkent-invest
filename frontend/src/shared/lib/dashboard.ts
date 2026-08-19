import type { InvestmentObject } from '@/entities/investment-object/types';

export type DashboardSection =
  | 'overview'
  | 'map'
  | 'projects'
  | 'applications'
  | 'favorites'
  | 'profile'
  | 'settings';

export function formatInvestmentAmount(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} mlrd`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} mln`;
  return `$${value.toLocaleString('en-US')}`;
}

export function projectAreaLabel(project: InvestmentObject) {
  const area = project.landAreaHa ?? project.buildingAreaSqm;
  if (area == null) return '—';
  return `${area} ${project.landAreaHa != null ? 'ga' : 'm²'}`;
}

export function applicationStatusLabel(status: string, locale: 'uz' | 'ru') {
  const labels = locale === 'ru'
    ? { pending: 'На рассмотрении', approved: 'Одобрено', rejected: 'Отклонено' }
    : { pending: 'Ko‘rib chiqilmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
  return labels[status as keyof typeof labels] ?? status;
}

export function dashboardSectionLabel(section: DashboardSection) {
  return ({
    overview: 'Bosh sahifa',
    map: 'Investitsiya xaritasi',
    projects: 'Loyihalar',
    applications: 'Arizalarim',
    favorites: 'Kuzatuvdagilar',
    profile: 'Profil',
    settings: 'Sozlamalar',
  })[section];
}
