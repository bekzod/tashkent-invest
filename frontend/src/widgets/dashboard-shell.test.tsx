import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import type { Session } from '@/shared/auth/session';
import { DashboardShell } from './dashboard-shell';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));

const session: Session = {
  token: 'token',
  user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
};

beforeEach(() => window.localStorage.clear());

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
  expect(screen.getAllByText('Панель управления').length).toBeGreaterThan(0);
  expect(screen.getByText('Центр помощи')).toBeVisible();
});
