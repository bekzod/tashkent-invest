import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { LanguageProvider, useLanguage } from '@/shared/i18n/language-provider';
import { api } from '@/shared/api/client';
import { ProfileView } from './profile';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('@/shared/api/client', () => ({ api: vi.fn() }));
vi.mock('@/shared/auth/session', () => ({ readSession: () => ({ token: 'token' }) }));

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

function object(title: string): InvestmentObject {
  return {
    id: title,
    slug: title,
    title,
    shortDescription: title,
    address: title,
    district: title,
    type: 'land',
    status: 'available',
    investmentAmountUsd: 1000,
  };
}

beforeEach(() => {
  apiMock.mockReset();
  window.localStorage.clear();
});
afterEach(cleanup);

test('does not let stale profile data replace the selected locale', async () => {
  const requests = {
    uz: { applications: deferred<unknown>(), favorites: deferred<unknown>() },
    ru: { applications: deferred<unknown>(), favorites: deferred<unknown>() },
  };
  apiMock.mockImplementation((path, _options, locale) =>
    requests[locale][path.includes('applications') ? 'applications' : 'favorites'].promise as never,
  );

  render(<LanguageProvider><LocaleSwitch /><ProfileView /></LanguageProvider>);
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
  await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(4));

  requests.ru.applications.resolve({ items: [] });
  requests.ru.favorites.resolve({ items: [object('Русский объект')] });
  expect(await screen.findByRole('heading', { name: 'Русский объект' })).toBeVisible();

  requests.uz.applications.resolve({ items: [] });
  requests.uz.favorites.resolve({ items: [object('Eski obyekt')] });
  await Promise.resolve();
  expect(screen.queryByRole('heading', { name: 'Eski obyekt' })).not.toBeInTheDocument();
});
