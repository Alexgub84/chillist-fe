import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n';
import {
  LanguageContext,
  type LanguageContextValue,
} from '../../../src/contexts/language-context';

vi.unmock('../../../src/contexts/useLanguage');

import LanguageProvider from '../../../src/contexts/LanguageProvider';

function LanguageConsumer() {
  const ctx = useContext(LanguageContext) as LanguageContextValue;
  return (
    <div>
      <span data-testid="lang">{ctx.language}</span>
      <button onClick={() => ctx.setLanguage('he')}>Switch to Hebrew</button>
      <button onClick={() => ctx.setLanguage('en')}>Switch to English</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>
    </I18nextProvider>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
    i18n.changeLanguage('en');
  });

  it('defaults to English', () => {
    renderWithProvider();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('sets dir=ltr and lang=en by default', () => {
    renderWithProvider();
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches to Hebrew and sets dir=rtl', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Switch to Hebrew'));

    expect(screen.getByTestId('lang')).toHaveTextContent('he');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('persists language to localStorage', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Switch to Hebrew'));

    expect(JSON.parse(localStorage.getItem('chillist-lang')!)).toBe('he');
  });

  it('restores language from localStorage', () => {
    localStorage.setItem('chillist-lang', JSON.stringify('he'));

    renderWithProvider();

    expect(screen.getByTestId('lang')).toHaveTextContent('he');
  });

  it('switches back to English from Hebrew', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Switch to Hebrew'));
    expect(document.documentElement.dir).toBe('rtl');

    await user.click(screen.getByText('Switch to English'));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('changes i18n language when switching', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Switch to Hebrew'));

    expect(i18n.language).toBe('he');
  });
});
