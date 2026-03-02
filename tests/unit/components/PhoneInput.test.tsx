import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput } from '../../../src/components/PhoneInput';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

function renderPhoneInput(
  overrides: Partial<Parameters<typeof PhoneInput>[0]> = {}
) {
  const defaultProps: Parameters<typeof PhoneInput>[0] = {
    countryValue: '',
    onCountryChange: vi.fn(),
    phoneProps: {},
    countrySelectAriaLabel: 'Country code',
    ...overrides,
  };
  return { ...render(<PhoneInput {...defaultProps} />), props: defaultProps };
}

describe('PhoneInput', () => {
  describe('rendering', () => {
    it('renders the combobox input and phone input', () => {
      renderPhoneInput({ phonePlaceholder: '050-1234567' });

      expect(screen.getByLabelText('Country code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('050-1234567')).toBeInTheDocument();
    });

    it('displays selected country flag and dial code', () => {
      renderPhoneInput({ countryValue: 'IL' });

      expect(screen.getByLabelText('Country code')).toHaveValue('🇮🇱 +972');
    });

    it('shows empty input when no country is selected', () => {
      renderPhoneInput({ countryValue: '' });

      expect(screen.getByLabelText('Country code')).toHaveValue('');
    });

    it('shows error message when provided', () => {
      renderPhoneInput({ error: 'Phone is required' });

      expect(screen.getByText('Phone is required')).toBeInTheDocument();
    });

    it('does not show error when not provided', () => {
      const { container } = renderPhoneInput();

      expect(container.querySelector('.text-red-600')).toBeNull();
    });
  });

  describe('search and filtering', () => {
    it('filters countries by name when typing', async () => {
      const user = userEvent.setup();
      renderPhoneInput();

      const input = screen.getByLabelText('Country code');
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'Israel');

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Israel');
      expect(options[0]).toHaveTextContent('+972');
    });

    it('filters countries by dial code prefix', async () => {
      const user = userEvent.setup();
      renderPhoneInput();

      const input = screen.getByLabelText('Country code');
      await user.click(input);
      await user.clear(input);
      await user.type(input, '+972');

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Israel');
    });

    it('filters by partial country name (case-insensitive)', async () => {
      const user = userEvent.setup();
      renderPhoneInput();

      const input = screen.getByLabelText('Country code');
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'germa');

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Germany');
    });

    it('shows max 12 results when dropdown opens', async () => {
      const user = userEvent.setup();
      renderPhoneInput();

      const input = screen.getByLabelText('Country code');
      await user.click(input);
      await user.clear(input);
      await user.type(input, ' ');
      await user.clear(input);

      const listbox = screen.queryByRole('listbox');
      if (listbox) {
        const options = within(listbox).getAllByRole('option');
        expect(options.length).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('selection', () => {
    it('calls onCountryChange when a country is selected', async () => {
      const user = userEvent.setup();
      const onCountryChange = vi.fn();
      renderPhoneInput({ onCountryChange });

      const input = screen.getByLabelText('Country code');
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'Israel');

      const listbox = screen.getByRole('listbox');
      const option = within(listbox).getByRole('option', { name: /Israel/ });
      await user.click(option);

      expect(onCountryChange).toHaveBeenCalledWith('IL');
    });
  });

  describe('className and error styling', () => {
    it('applies custom className', () => {
      const { container } = renderPhoneInput({ className: 'my-custom-class' });

      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });
});
