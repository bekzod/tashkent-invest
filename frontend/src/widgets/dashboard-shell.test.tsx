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

  const languageSelect = screen.getByRole('combobox', { name: 'Til' });
  expect(languageSelect).toHaveClass('dashboard-locale-select');
  fireEvent.click(languageSelect);
  fireEvent.click(screen.getByRole('option', { name: 'RU' }));

  expect(screen.getByRole('navigation').closest('aside')).toHaveAttribute('aria-label', 'Навигация кабинета');
  expect(screen.getByRole('link', { name: /Invest Tuman/ })).toHaveAttribute('href', '/ru');
  expect(screen.getByRole('link', { name: 'Объекты' })).toHaveAttribute('href', '/dashboard/projects');
  expect(screen.getAllByText('Панель управления').length).toBeGreaterThan(0);
  expect(screen.getByText('Центр помощи')).toBeVisible();
});

test('does not render the user profile control in the sidebar', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="overview" role="admin" session={session}>
        <p>Content</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  expect(document.querySelector('.dashboard-sidebar .dashboard-profile-side')).not.toBeInTheDocument();
});

test('collapses and expands the sidebar without losing the menu control', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="projects" role="admin" session={session}>
        <p>Content</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  const dashboard = document.querySelector('.invest-dashboard');
  const sidebar = screen.getByRole('navigation').closest('aside');
  const collapseButton = screen.getByRole('button', { name: 'Menyuni yig‘ish' });

  expect(sidebar).toHaveAttribute('id', 'dashboard-sidebar');
  expect(collapseButton).toHaveAttribute('aria-controls', 'dashboard-sidebar');
  expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
  expect(dashboard).not.toHaveClass('is-collapsed');

  fireEvent.click(collapseButton);

  const expandButton = screen.getByRole('button', { name: 'Menyuni ochish' });
  expect(dashboard).toHaveClass('is-collapsed');
  expect(expandButton).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(expandButton);

  expect(screen.getByRole('button', { name: 'Menyuni yig‘ish' })).toHaveAttribute('aria-expanded', 'true');
  expect(dashboard).not.toHaveClass('is-collapsed');
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
  const closeButton = screen.getByRole('button', { name: 'Yopish' });
  expect(closeButton).toHaveClass('dashboard-notification-close');
  expect(closeButton).toHaveTextContent('');

  fireEvent.click(closeButton);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(notificationsButton).toHaveAttribute('aria-expanded', 'false');
});

test('opens role navigation in a mobile sheet and closes it after navigation', () => {
  render(
    <LanguageProvider>
      <DashboardShell activeSection="overview" role="admin" session={session}>
        <p>Content</p>
      </DashboardShell>
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Menyuni ochish - Kabinet navigatsiyasi' }));

  expect(screen.getByRole('dialog')).toHaveTextContent('Invest Tuman');
  const mobileObjectsLink = screen.getAllByRole('link', { name: 'Obyektlar' }).at(-1)!;
  mobileObjectsLink.addEventListener('click', (event) => event.preventDefault(), { once: true });
  fireEvent.click(mobileObjectsLink);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
