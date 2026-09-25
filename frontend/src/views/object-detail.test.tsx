import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { api } from '@/shared/api/client';
import { ObjectDetail } from './object-detail';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('@/shared/api/client', () => ({ api: vi.fn() }));

afterEach(cleanup);

test('shows localized not-found copy when an object request fails', async () => {
  vi.mocked(api).mockRejectedValueOnce(new Error('not found'));

  render(<LanguageProvider initialLocale="ru"><ObjectDetail slug="missing" /></LanguageProvider>);

  expect(await screen.findByText('Страница не найдена.')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Смотреть карту' })).toHaveAttribute('href', '/ru/map');
});
