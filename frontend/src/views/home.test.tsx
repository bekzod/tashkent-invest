import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { LanguageProvider, useLanguage } from '@/shared/i18n/language-provider';
import { api } from '@/shared/api/client';
import HomePage from './home';

const { mapPropsMock, pushMock } = vi.hoisted(() => ({
  mapPropsMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a> }));
vi.mock('@/features/investment-map/map-page-client', () => ({ MapPageClient: (props: unknown) => { mapPropsMock(props); return <div data-testid="home-map" />; } }));
vi.mock('@/shared/api/client', () => ({ api: vi.fn() }));

const apiMock = vi.mocked(api);
const object: InvestmentObject = {
  id: 'object-1', slug: 'object-1', title: 'Test object', shortDescription: 'Description', address: 'Address', district: 'District', type: 'land', status: 'auction', investmentAmountUsd: 1000,
};

function renderHome() {
  return render(<LanguageProvider><HomePage /></LanguageProvider>);
}

function LocaleSwitch() {
  const { setLocale } = useLanguage();
  return <button type="button" onClick={() => setLocale('ru')}>Russian</button>;
}

beforeEach(() => {
  window.localStorage.clear();
  apiMock.mockReset();
  pushMock.mockReset();
  mapPropsMock.mockReset();
});
afterEach(cleanup);

test('shows four content placeholders while initial landing data is pending', () => {
  apiMock.mockImplementation(() => new Promise(() => undefined));

  renderHome();

  expect(screen.getAllByTestId('content-placeholder')).toHaveLength(4);
});

test('keeps server-rendered object cards visible while a locale refresh is pending', () => {
  apiMock.mockImplementation(() => new Promise(() => undefined));
  render(<LanguageProvider><HomePage initialLocale="uz" initialObjects={[object]} initialStats={{ objects: 1, auctions: 1, upcoming: 0, investmentAmountUsd: 0 }} /><LocaleSwitch /></LanguageProvider>);

  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));

  expect(screen.getByText('Test object')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Инвестируйте в будущее района' })).toBeVisible();
  expect(screen.getByText('Тип объекта')).toBeVisible();
  expect(screen.queryAllByTestId('content-placeholder')).toHaveLength(0);
});

test('shows an error and retries the landing request', async () => {
  apiMock.mockRejectedValue(new Error('Network error'));
  renderHome();

  expect(await screen.findByRole('alert')).toHaveTextContent('Ma’lumotlarni yuklab bo‘lmadi');
  expect(screen.getByRole('button', { name: 'Qayta urinish' })).toBeVisible();

  apiMock.mockReset();
  apiMock
    .mockResolvedValueOnce({ objects: 20, auctions: 5, upcoming: 3, investmentAmountUsd: 0 })
    .mockResolvedValueOnce({ items: [object] })
    .mockResolvedValueOnce({ items: [object] })
    .mockResolvedValueOnce({ items: [object] })
    .mockResolvedValueOnce({ items: [object] });
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));

  await waitFor(() => expect(screen.getByText('Test object')).toBeVisible());
  expect(screen.queryAllByTestId('content-placeholder')).toHaveLength(0);
});

test('keeps landing searches, filters, and object cards in the active locale', () => {
  render(
    <LanguageProvider initialLocale="ru">
      <HomePage
        initialLocale="ru"
        initialObjects={[object]}
        initialStats={{ objects: 1, auctions: 1, upcoming: 0, investmentAmountUsd: 0 }}
      />
    </LanguageProvider>,
  );

  expect(screen.getByRole('link', { name: 'Смотреть все' })).toHaveAttribute('href', '/ru/map');
  expect(screen.getByRole('link', { name: 'Подробнее →' })).toHaveAttribute(
    'href',
    '/ru/objects/object-1',
  );
  expect(screen.getByRole('link', { name: /Промышленность/ })).toHaveAttribute(
    'href',
    '/ru/map?sectors=manufacturing',
  );

  const searchInput = screen.getByRole('textbox', { name: /Поиск по названию/ });
  fireEvent.change(searchInput, {
    target: { value: 'Chinobod' },
  });
  fireEvent.submit(searchInput.closest('form')!);

  expect(pushMock).toHaveBeenCalledWith(
    '/ru/map?q=Chinobod',
  );
});

test('synchronizes every discovery filter with the embedded map and map link', () => {
  render(
    <LanguageProvider initialLocale="uz">
      <HomePage
        initialLocale="uz"
        initialObjects={[object]}
        initialStats={{ objects: 1, auctions: 1, upcoming: 0, investmentAmountUsd: 0 }}
      />
    </LanguageProvider>,
  );

  fireEvent.change(screen.getByRole('textbox', { name: /Nomi, tuman/ }), {
    target: { value: 'E2E markaz' },
  });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Yer uchastkasi' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Auksionda' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Yo‘nalish' }), {
    target: { value: 'logistics' },
  });
  fireEvent.change(screen.getByRole('slider', { name: /Maydon/ }), {
    target: { value: '12' },
  });

  expect(screen.getByRole('link', { name: 'Obyektlarni ko‘rsatish' })).toHaveAttribute(
    'href',
    '/uz/map?q=E2E+markaz&types=land&statuses=auction&sectors=logistics&areaMin=12',
  );
  expect(screen.getByRole('link', { name: 'Obyektlarni ko‘rsatish' }).querySelector('svg')).toBeTruthy();
  expect(mapPropsMock.mock.calls.at(-1)?.[0]).toMatchObject({
    controlledFilters: {
      q: 'E2E markaz',
      types: ['land'],
      statuses: ['auction'],
      sectors: ['logistics'],
      areaMin: 12,
    },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Tozalash' }));
  expect(screen.getByRole('link', { name: 'Obyektlarni ko‘rsatish' })).toHaveAttribute(
    'href',
    '/uz/map',
  );
  expect(screen.getByRole('textbox', { name: /Nomi, tuman/ })).toHaveValue('');
});
