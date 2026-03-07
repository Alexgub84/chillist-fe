import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockLanguage = { language: 'en' as const, setLanguage: vi.fn() };
vi.mock('../../../src/contexts/useLanguage', () => ({
  useLanguage: () => mockLanguage,
}));

let mockPlanCtx: { plan: unknown; planPoints: number } | null = null;
vi.mock('../../../src/hooks/usePlanContext', () => ({
  usePlanContext: () => mockPlanCtx,
}));

import ItemForm from '../../../src/components/ItemForm';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const getInputByLabel = (labelText: RegExp) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div') || label.parentElement;
  return container?.querySelector('input, textarea, select') as HTMLElement;
};

const getUnitSelect = () =>
  document.querySelector('select[name="unit"]') as HTMLSelectElement;

describe('ItemForm', () => {
  describe('Default values and rendering', () => {
    it('renders with default values: category=food, unit=kg, quantity=1', () => {
      render(<ItemForm onSubmit={vi.fn()} />);

      const categorySelect = getInputByLabel(
        /category \*/i
      ) as HTMLSelectElement;
      expect(categorySelect.value).toBe('food');

      const unitSelect = getUnitSelect();
      expect(unitSelect.value).toBe('kg');

      const quantityInput = getInputByLabel(/quantity \*/i) as HTMLInputElement;
      expect(quantityInput.value).toBe('1');
    });

    it('renders custom submitLabel', () => {
      render(<ItemForm onSubmit={vi.fn()} submitLabel="Save Changes" />);

      expect(
        screen.getByRole('button', { name: /save changes/i })
      ).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(<ItemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is omitted', () => {
      render(<ItemForm onSubmit={vi.fn()} />);

      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /add item/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('does not submit when quantity is less than 1', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(
        <ItemForm
          onSubmit={handleSubmit}
          defaultValues={{ name: 'Test Item', quantity: 0 }}
        />
      );

      await user.click(screen.getByRole('button', { name: /add item/i }));

      await new Promise((r) => setTimeout(r, 100));

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Equipment category behavior', () => {
    it('forces unit to pcs and disables unit selector when category is equipment', async () => {
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const categorySelect = getInputByLabel(/category \*/i);
      await user.selectOptions(categorySelect, 'equipment');

      const unitSelect = getUnitSelect();

      await waitFor(() => {
        expect(unitSelect).toBeDisabled();
        expect(unitSelect.value).toBe('pcs');
      });
    });

    it('re-enables unit selector when switching back from equipment to food', async () => {
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const categorySelect = getInputByLabel(/category \*/i);
      await user.selectOptions(categorySelect, 'equipment');

      const unitSelect = getUnitSelect();
      await waitFor(() => {
        expect(unitSelect).toBeDisabled();
      });

      await user.selectOptions(categorySelect, 'food');

      await waitFor(() => {
        expect(unitSelect).not.toBeDisabled();
      });
    });
  });

  describe('Autocomplete item selection', () => {
    it('auto-fills category and unit when selecting a known common item', async () => {
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Tent');

      const tentOption = await screen.findByRole('option', { name: 'Tent' });
      await user.click(tentOption);

      const categorySelect = getInputByLabel(
        /category \*/i
      ) as HTMLSelectElement;
      const unitSelect = getUnitSelect();

      await waitFor(() => {
        expect(categorySelect.value).toBe('equipment');
        expect(unitSelect.value).toBe('pcs');
      });
    });

    it('suggests Hebrew items when language is Hebrew', async () => {
      mockLanguage.language = 'he';

      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'אוהל');

      const option = await screen.findByRole('option', { name: 'אוהל' });
      expect(option).toBeInTheDocument();

      await user.click(option);

      const categorySelect = getInputByLabel(
        /category \*/i
      ) as HTMLSelectElement;
      const unitSelect = getUnitSelect();

      await waitFor(() => {
        expect(categorySelect.value).toBe('equipment');
        expect(unitSelect.value).toBe('pcs');
      });

      mockLanguage.language = 'en';
    });

    it('does not suggest English items when language is Hebrew', async () => {
      mockLanguage.language = 'he';

      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Tent');

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100));
      });
      expect(
        screen.queryByRole('option', { name: 'Tent' })
      ).not.toBeInTheDocument();

      mockLanguage.language = 'en';
    });
  });

  describe('Quantity suggestion', () => {
    it('auto-fills suggested quantity when selecting a food item with planContext', async () => {
      mockPlanCtx = { plan: {}, planPoints: 10 };
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Bread');

      const breadOption = await screen.findByRole('option', { name: 'Bread' });
      await user.click(breadOption);

      const quantityInput = getInputByLabel(/quantity \*/i) as HTMLInputElement;
      await waitFor(() => {
        expect(Number(quantityInput.value)).toBe(2);
      });

      mockPlanCtx = null;
    });

    it('keeps quantity as 1 when selecting an equipment item even with planContext', async () => {
      mockPlanCtx = { plan: {}, planPoints: 10 };
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Tent');

      const tentOption = await screen.findByRole('option', { name: 'Tent' });
      await user.click(tentOption);

      const quantityInput = getInputByLabel(/quantity \*/i) as HTMLInputElement;
      await waitFor(() => {
        expect(Number(quantityInput.value)).toBe(1);
      });

      mockPlanCtx = null;
    });

    it('keeps quantity as 1 when planContext is null', async () => {
      mockPlanCtx = null;
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Bread');

      const breadOption = await screen.findByRole('option', { name: 'Bread' });
      await user.click(breadOption);

      const quantityInput = getInputByLabel(/quantity \*/i) as HTMLInputElement;
      await waitFor(() => {
        expect(Number(quantityInput.value)).toBe(1);
      });
    });

    it('scales quantity with higher planPoints', async () => {
      mockPlanCtx = { plan: {}, planPoints: 40 };
      const user = userEvent.setup();
      render(<ItemForm onSubmit={vi.fn()} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Bread');

      const breadOption = await screen.findByRole('option', { name: 'Bread' });
      await user.click(breadOption);

      const quantityInput = getInputByLabel(/quantity \*/i) as HTMLInputElement;
      await waitFor(() => {
        expect(Number(quantityInput.value)).toBe(6);
      });

      mockPlanCtx = null;
    });
  });

  describe('Submission', () => {
    it('calls onSubmit with correct form values on valid submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<ItemForm onSubmit={handleSubmit} />);

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, 'Rice');

      const quantityInput = getInputByLabel(/quantity \*/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      await user.selectOptions(getInputByLabel(/category \*/i), 'food');
      await user.selectOptions(getUnitSelect(), 'kg');
      const notesTextarea = screen.getByPlaceholderText(/optional notes/i);
      await user.type(notesTextarea, 'Basmati');

      await user.click(screen.getByRole('button', { name: /add item/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Rice',
            category: 'food',
            quantity: 5,
            unit: 'kg',
            notes: 'Basmati',
          }),
          expect.anything()
        );
      });
    });

    it('shows "Saving…" and disables submit button when isSubmitting is true', () => {
      render(<ItemForm onSubmit={vi.fn()} isSubmitting />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Saving…');
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleCancel = vi.fn();
      render(<ItemForm onSubmit={vi.fn()} onCancel={handleCancel} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });
});
