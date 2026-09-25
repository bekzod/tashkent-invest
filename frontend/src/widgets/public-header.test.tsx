import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { PublicHeader } from './public-header';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

beforeEach(() => {
  pushMock.mockReset();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/ru/objects/demo?from=map#application');
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

test('uses the active locale for every public navigation link', () => {
  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru/objects/demo" />
    </LanguageProvider>,
  );

  expect(screen.getByRole('link', { name: /Invest Tuman/ })).toHaveAttribute('href', '/ru');
  expect(screen.getByRole('link', { name: 'Карта' })).toHaveAttribute('href', '/ru/map');
  expect(screen.getByRole('link', { name: 'Проекты' })).toHaveAttribute('href', '/ru#projects');
  expect(screen.getByRole('link', { name: 'Аукционы' })).toHaveAttribute(
    'href',
    '/ru/map?statuses=auction',
  );
  expect(screen.getByRole('link', { name: 'Новости' })).toHaveAttribute('href', '/ru#news');
  expect(screen.getByRole('link', { name: /Войти/ })).toHaveAttribute('href', '/ru/login');
});

test('switches to the equivalent localized URL and persists the choice', () => {
  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru/objects/demo" />
    </LanguageProvider>,
  );

  fireEvent.change(screen.getByRole('combobox', { name: 'Язык' }), {
    target: { value: 'uz' },
  });

  expect(pushMock).toHaveBeenCalledWith('/uz/objects/demo?from=map#application');
  expect(window.localStorage.getItem('tashkent-invest.locale')).toBe('uz');
});

test('keeps an authenticated dashboard destination unprefixed', async () => {
  window.localStorage.setItem(
    'tashkent-invest.session',
    JSON.stringify({
      token: 'token',
      user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' },
    }),
  );

  render(
    <LanguageProvider initialLocale="ru">
      <PublicHeader pathname="/ru" />
    </LanguageProvider>,
  );

  await waitFor(() =>
    expect(screen.getByRole('link', { name: /Войти/ })).toHaveAttribute('href', '/dashboard'),
  );
});
