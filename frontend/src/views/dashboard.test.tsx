import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { LanguageProvider, useLanguage } from '@/shared/i18n/language-provider';
import { api } from '@/shared/api/client';
import { DashboardView } from './dashboard';

const { notifyWarningMock } = vi.hoisted(() => ({ notifyWarningMock: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('@/shared/api/client', () => ({ api: vi.fn() }));
vi.mock('@/shared/auth/session', () => ({
  readSession: () => ({
    token: 'token',
    user: { id: 'investor-1', name: 'Investor', email: 'investor@example.com', role: 'investor' },
  }),
}));
vi.mock('@/widgets/dashboard-shell', () => ({ DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/features/investment-map/map-page-client', () => ({ MapPageClient: () => <div /> }));
vi.mock('@/features/admin-objects/admin-objects-list', () => ({ AdminObjectsList: () => <div /> }));
vi.mock('@/features/admin-objects/admin-overview', () => ({ AdminOverview: () => <div /> }));
vi.mock('@/features/admin-applications/admin-applications', () => ({ AdminApplications: () => <div /> }));
vi.mock('@/shared/ui/feedback', () => ({ notify: { warning: notifyWarningMock } }));

const apiMock = vi.mocked(api);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

function LocaleSwitch() {
  const { setLocale } = useLanguage();
  return <button type="button" onClick={() => setLocale('ru')}>Russian</button>;
}

const object = (title: string): InvestmentObject => ({
  id: title,
  slug: title,
  title,
  shortDescription: title,
  address: title,
  district: title,
  type: 'land',
  status: 'available',
  landAreaHa: 2,
  investmentAmountUsd: 1000,
});

beforeEach(() => {
  apiMock.mockReset();
  notifyWarningMock.mockReset();
  window.localStorage.clear();
});

afterEach(cleanup);

test('ignores an older dashboard response after the locale changes', async () => {
  const requests = {
    uz: {
      stats: deferred<unknown>(), objects: deferred<unknown>(), applications: deferred<unknown>(), favorites: deferred<unknown>(),
    },
    ru: {
      stats: deferred<unknown>(), objects: deferred<unknown>(), applications: deferred<unknown>(), favorites: deferred<unknown>(),
    },
  };
  apiMock.mockImplementation((path, _options, locale) => {
    const key = path === '/statistics' ? 'stats' : path.startsWith('/objects') ? 'objects' : path.includes('applications') ? 'applications' : 'favorites';
    return requests[locale][key].promise as never;
  });

  render(
    <LanguageProvider>
      <LocaleSwitch />
      <DashboardView activeSection="projects" />
    </LanguageProvider>,
  );
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(4));
  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(8));

  requests.ru.stats.resolve({ objects: 1, auctions: 0, upcoming: 0, investmentAmountUsd: 1000 });
  requests.ru.objects.resolve({ items: [object('Русский объект')], meta: { total: 1 } });
  requests.ru.applications.resolve({ items: [] });
  requests.ru.favorites.resolve({ items: [] });
  expect(await screen.findByText('Русский объект')).toBeVisible();

  requests.uz.stats.resolve({ objects: 1, auctions: 0, upcoming: 0, investmentAmountUsd: 1000 });
  requests.uz.objects.resolve({ items: [object('Eski o‘zbek obyekt')], meta: { total: 1 } });
  requests.uz.applications.resolve({ items: [] });
  requests.uz.favorites.resolve({ items: [] });
  await Promise.resolve();

  expect(screen.getByText('Русский объект')).toBeVisible();
  expect(screen.queryByText('Eski o‘zbek obyekt')).not.toBeInTheDocument();
});

test('keeps successful dashboard data when one independent request fails', async () => {
  apiMock.mockImplementation((path) => {
    if (path === '/statistics') {
      return Promise.resolve({ objects: 1, auctions: 0, upcoming: 0, investmentAmountUsd: 1000 }) as never;
    }
    if (path.startsWith('/objects')) {
      return Promise.resolve({ items: [object('Saqlangan loyiha')], meta: { total: 1 } }) as never;
    }
    if (path.includes('applications')) return Promise.resolve({ items: [] }) as never;
    return Promise.reject(new Error('favorites unavailable')) as never;
  });

  render(<LanguageProvider><DashboardView activeSection="projects" /></LanguageProvider>);

  expect(await screen.findByText('Saqlangan loyiha')).toBeVisible();
  expect(notifyWarningMock).toHaveBeenCalledWith('Ayrim ma’lumotlar yuklanmadi. Qayta urinib ko‘ring.');
});
