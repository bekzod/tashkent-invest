import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import type { Session } from '@/shared/auth/session';
import { DashboardShell } from './dashboard-shell';

const routerPush = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));

const session: Session = {
  token: 'token',
  user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
};

beforeEach(() => {
  window.localStorage.clear();
  routerPush.mockReset();
});

afterEach(cleanup);

test('localizes authenticated dashboard navigation when the locale changes', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="overview" role="admin" session={session}>
        <p>Content</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  fireEvent.change(screen.getByRole('combobox', { name: 'Til' }), { target: { value: 'ru' } });

  expect(screen.getByRole('navigation').closest('aside')).toHaveAttribute('aria-label', 'Навигация кабинета');
  expect(screen.getByRole('link', { name: /Invest Tuman/ })).toHaveAttribute('href', '/ru');
  expect(screen.getByRole('link', { name: 'Объекты' })).toHaveAttribute('href', '/dashboard/projects');
  expect(screen.getAllByText('Панель управления').length).toBeGreaterThan(0);
  expect(screen.getByText('Центр помощи')).toBeVisible();
});

test('opens the map search when the search action is clicked', () => {
  const searchFocus = vi.fn();
  window.addEventListener('dashboard-search-focus', searchFocus);
  render(
    <LanguageProvider>
      <DashboardShell activeSection="map" role="admin" session={session}>
        <p>Map</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Qidiruv' }));

  expect(searchFocus).toHaveBeenCalledTimes(1);
  window.removeEventListener('dashboard-search-focus', searchFocus);
});

test('navigates to the map before searching from another dashboard section', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="overview" role="admin" session={session}>
        <p>Overview</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Qidiruv' }));

  expect(routerPush).toHaveBeenCalledWith('/dashboard/map');
});

test('opens and closes the notifications panel from the top bar', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="overview" role="admin" session={session}>
        <p>Content</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  const notificationsButton = screen.getByRole('button', { name: 'Xabarnomalar' });
  expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(notificationsButton);

  expect(notificationsButton).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('dialog')).toHaveTextContent('Yangi xabarnomalar yo‘q');
  expect(screen.getByRole('button', { name: 'Yopish' })).toBeVisible();

  fireEvent.click(screen.getByRole('button', { name: 'Yopish' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
});
