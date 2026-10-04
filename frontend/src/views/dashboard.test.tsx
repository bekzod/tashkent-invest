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

test('projects requests only its own data and ignores a stale locale response', async () => {
  const requests = { uz: deferred<unknown>(), ru: deferred<unknown>() };
  apiMock.mockImplementation((_path, _options, locale) => requests[locale].promise as never);

  render(
    <LanguageProvider>
      <LocaleSwitch />
      <DashboardView activeSection="projects" />
    </LanguageProvider>,
  );
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1));
  expect(apiMock).toHaveBeenLastCalledWith('/objects?limit=12&page=1', expect.anything(), 'uz');
  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));

  requests.ru.resolve({ items: [object('Русский объект')], meta: { total: 1, totalPages: 1, limit: 12 } });
  expect(await screen.findByRole('heading', { name: 'Русский объект' })).toBeVisible();

  requests.uz.resolve({ items: [object('Eski o‘zbek obyekt')], meta: { total: 1, totalPages: 1, limit: 12 } });
  await Promise.resolve();

  expect(screen.getByRole('heading', { name: 'Русский объект' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Eski o‘zbek obyekt' })).not.toBeInTheDocument();
});

test('overview keeps successful data when one independent request fails', async () => {
  apiMock.mockImplementation((path) => {
    if (path === '/statistics') {
      return Promise.resolve({ objects: 1, auctions: 0, upcoming: 0, investmentAmountUsd: 1000 }) as never;
    }
    if (path.startsWith('/objects')) {
      return Promise.resolve({ items: [object('Saqlangan loyiha')], meta: { total: 1 } }) as never;
    }
    return Promise.reject(new Error('applications unavailable')) as never;
  });

  render(<LanguageProvider><DashboardView activeSection="overview" /></LanguageProvider>);

  expect(await screen.findByRole('heading', { name: 'Saqlangan loyiha' })).toBeVisible();
  expect(apiMock).toHaveBeenCalledTimes(3);
  expect(notifyWarningMock).toHaveBeenCalledWith('Ayrim ma’lumotlar yuklanmadi. Qayta urinib ko‘ring.');
});

test('settings renders without making dashboard data requests', async () => {
  render(<LanguageProvider><DashboardView activeSection="settings" /></LanguageProvider>);

  expect(await screen.findByRole('heading', { name: 'Sozlamalar' })).toBeVisible();
  expect(apiMock).not.toHaveBeenCalled();
  expect(screen.getByRole('combobox', { name: 'Til' })).toBeVisible();
});
