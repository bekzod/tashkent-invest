import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { adminObjectsApi } from './api';
import { ObjectEditor } from './object-editor';

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: replaceMock }) }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock('./location-picker', () => ({ LocationPicker: () => <div data-testid="location-picker" /> }));
vi.mock('./api', () => ({
  adminObjectsApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

beforeEach(() => {
  replaceMock.mockReset();
  vi.mocked(adminObjectsApi.create).mockResolvedValue({
    id: 'draft-1',
    status: 'draft',
    translations: [],
    media: [],
  });
});

afterEach(cleanup);

test('submits every Russian admin translation field in the draft payload', async () => {
  render(<LanguageProvider><ObjectEditor /></LanguageProvider>);

  fireEvent.change(screen.getByLabelText('O‘zbekcha nom'), { target: { value: 'Sanoat maydoni' } });
  fireEvent.change(screen.getByLabelText('O‘zbekcha manzil'), { target: { value: 'Chinobod' } });
  fireEvent.change(screen.getByLabelText('Qisqa tavsif'), { target: { value: 'Qisqa' } });
  fireEvent.change(screen.getByLabelText('Batafsil tavsif'), { target: { value: 'Batafsil' } });
  fireEvent.change(screen.getByLabelText('Ruscha nom (ixtiyoriy)'), { target: { value: 'Промышленная площадка' } });
  fireEvent.change(screen.getByLabelText('Ruscha manzil'), { target: { value: 'Чинабад' } });
  fireEvent.change(screen.getByLabelText('Ruscha qisqa tavsif'), { target: { value: 'Краткое описание' } });
  fireEvent.change(screen.getByLabelText('Ruscha batafsil tavsif'), { target: { value: 'Подробное описание' } });
  fireEvent.click(screen.getByRole('button', { name: /Qoralama saqlash/ }));

  await waitFor(() => expect(adminObjectsApi.create).toHaveBeenCalledTimes(1));
  expect(vi.mocked(adminObjectsApi.create).mock.calls[0][0].translations).toEqual({
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
