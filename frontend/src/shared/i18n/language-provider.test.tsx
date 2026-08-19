import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import { LanguageProvider, useLanguage } from './language-provider';

function Probe() { const { locale, setLocale, t } = useLanguage(); return <><span data-testid="locale">{locale}</span><span>{t('map')}</span><button onClick={() => setLocale('ru')}>Russian</button></>; }

test('persists selected language in local storage', async () => {
  window.localStorage.clear();
  render(<LanguageProvider><Probe /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Russian' }));
  expect(screen.getByTestId('locale')).toHaveTextContent('ru');
  expect(window.localStorage.getItem('tashkent-invest.locale')).toBe('ru');
});
