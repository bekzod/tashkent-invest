import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { LanguageProvider, useLanguage } from './language-provider';

function Probe() { const { locale, setLocale, t } = useLanguage(); return <><span data-testid="locale">{locale}</span><span>{t('map')}</span><button onClick={() => setLocale('ru')}>Russian</button></>; }

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
  document.documentElement.lang = '';
  document.cookie = 'tashkent-invest.locale=; Path=/; Max-Age=0';
});

test('renders an explicit locale on the first render and ignores saved locale on public routes', async () => {
  window.history.replaceState({}, '', '/ru/map');
  window.localStorage.setItem('tashkent-invest.locale', 'uz');

  render(<LanguageProvider initialLocale="ru"><Probe /></LanguageProvider>);

  expect(screen.getByTestId('locale')).toHaveTextContent('ru');
  expect(screen.getByText('Карта')).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute('lang', 'ru');
  expect(window.localStorage.getItem('tashkent-invest.locale')).toBe('ru');
  expect(document.cookie).toContain('tashkent-invest.locale=ru');

  await act(async () => Promise.resolve());
  expect(screen.getByTestId('locale')).toHaveTextContent('ru');
});

test('uses the saved locale on unprefixed private routes', async () => {
  window.history.replaceState({}, '', '/dashboard');
  window.localStorage.setItem('tashkent-invest.locale', 'ru');

  render(<LanguageProvider initialLocale="uz"><Probe /></LanguageProvider>);

  await waitFor(() => expect(screen.getByTestId('locale')).toHaveTextContent('ru'));
  expect(document.documentElement).toHaveAttribute('lang', 'ru');
});

test('persists selected language in local storage', async () => {
  window.localStorage.clear();
  render(<LanguageProvider><Probe /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
  expect(screen.getByTestId('locale')).toHaveTextContent('ru');
  expect(window.localStorage.getItem('tashkent-invest.locale')).toBe('ru');
  expect(document.cookie).toContain('tashkent-invest.locale=ru');
  expect(document.documentElement).toHaveAttribute('lang', 'ru');
});
