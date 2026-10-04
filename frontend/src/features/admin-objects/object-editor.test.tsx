import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { ObjectEditor } from './object-editor';

const { createMock, replaceMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  replaceMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: replaceMock }) }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('maplibre-gl', () => {
  class MockMap {
    sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
    addControl = vi.fn();
    addLayer = vi.fn();
    flyTo = vi.fn();
    fitBounds = vi.fn();
    getZoom = vi.fn(() => 11);
    jumpTo = vi.fn();
    remove = vi.fn();
    addSource(name: string) { this.sources.set(name, { setData: vi.fn() }); }
    getSource(name: string) { return this.sources.get(name); }
    on(name: string, handler: () => void) { if (name === 'load') handler(); }
  }
  class MockMarker {
    addTo = vi.fn(() => this);
    getLngLat = vi.fn(() => ({ lng: 69.22, lat: 41.39 }));
    on = vi.fn(() => this);
    remove = vi.fn();
    setLngLat = vi.fn(() => this);
  }
  return { default: { Map: MockMap, Marker: MockMarker, NavigationControl: class {} } };
});

const service = { create: createMock, update: updateMock };

beforeEach(() => {
  vi.clearAllMocks();
  replaceMock.mockReset();
  createMock.mockResolvedValue({
    id: 'draft-1',
    status: 'draft',
    translations: [],
    media: [],
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });
});

afterEach(cleanup);

test('submits every Russian admin translation field in the draft payload', async () => {
  render(<LanguageProvider><ObjectEditor service={service} /></LanguageProvider>);

  fireEvent.change(screen.getByLabelText('O‘zbekcha nom'), { target: { value: 'Sanoat maydoni' } });
  fireEvent.change(screen.getByLabelText('O‘zbekcha manzil'), { target: { value: 'Chinobod' } });
  fireEvent.change(screen.getByLabelText('Qisqa tavsif'), { target: { value: 'Qisqa' } });
  fireEvent.change(screen.getByLabelText('Batafsil tavsif'), { target: { value: 'Batafsil' } });
  fireEvent.change(screen.getByLabelText('Ruscha nom (ixtiyoriy)'), { target: { value: 'Промышленная площадка' } });
  fireEvent.change(screen.getByLabelText('Ruscha manzil'), { target: { value: 'Чинабад' } });
  fireEvent.change(screen.getByLabelText('Ruscha qisqa tavsif'), { target: { value: 'Краткое описание' } });
  fireEvent.change(screen.getByLabelText('Ruscha batafsil tavsif'), { target: { value: 'Подробное описание' } });
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));

  await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
  expect(createMock.mock.calls[0][0].translations).toEqual({
    uz: expect.objectContaining({
      title: 'Sanoat maydoni',
      address: 'Chinobod',
      shortDescription: 'Qisqa',
      description: 'Batafsil',
    }),
    ru: expect.objectContaining({
      title: 'Промышленная площадка',
      address: 'Чинабад',
      shortDescription: 'Краткое описание',
      description: 'Подробное описание',
    }),
  });
  expect(replaceMock).toHaveBeenCalledWith('/dashboard/projects/draft-1/edit');
});

test('keeps blank coordinates null instead of submitting the Gulf of Guinea', async () => {
  render(<LanguageProvider><ObjectEditor service={service} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));

  await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
  expect(createMock.mock.calls[0][0]).toMatchObject({
    latitude: null,
    longitude: null,
  });
});

test('shows and submits the e-auksion link for auction objects', async () => {
  const object = {
    id: 'auction-1',
    status: 'auction' as const,
    translations: [],
    media: [],
  };
  updateMock.mockResolvedValue(object);
  render(<LanguageProvider><ObjectEditor object={object} service={service} /></LanguageProvider>);

  const auctionLink = screen.getByLabelText('E-auksion havolasi');
  expect(auctionLink).toHaveAttribute('placeholder', 'https://e-auksion.uz/lot-view?...');
  fireEvent.change(auctionLink, {
    target: { value: 'https://e-auksion.uz/lot-view?lot_id=123' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));

  await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
  expect(updateMock.mock.calls[0][1]).toMatchObject({
    auctionUrl: 'https://e-auksion.uz/lot-view?lot_id=123',
  });
});

test('requires the coordinate pair and invalidates stale geometry when a point moves', async () => {
  const geometry: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[[69.21, 41.38], [69.22, 41.38], [69.22, 41.39], [69.21, 41.38]]],
  };
  const object = {
    id: 'object-1',
    status: 'draft' as const,
    latitude: 41.38,
    longitude: 69.21,
    siteGeometry: geometry,
    translations: [],
    media: [],
  };
  updateMock.mockResolvedValue(object);
  render(<LanguageProvider><ObjectEditor object={object} service={service} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: /Joylashuv/ }));
  fireEvent.change(screen.getByLabelText('Kenglik'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));
  expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent(/birga kiriting/i);
  expect(updateMock).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('Kenglik'), { target: { value: '41.39' } });
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));
  await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
  expect(updateMock.mock.calls[0][1]).toMatchObject({
    latitude: 41.39,
    longitude: 69.21,
    siteGeometry: null,
    geometrySource: null,
  });
});
