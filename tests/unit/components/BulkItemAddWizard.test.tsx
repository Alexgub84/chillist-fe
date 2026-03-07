import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkItemAddWizard from '../../../src/components/BulkItemAddWizard';

vi.mock('../../../src/components/shared/Modal', () => ({
  default: ({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) => {
    if (!open) return null;
    return (
      <div role="dialog" data-testid="modal">
        {title && <h2>{title}</h2>}
        {children}
        <button type="button" onClick={onClose} aria-label="close-modal">
          ×
        </button>
      </div>
    );
  },
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const defaultProps: Parameters<typeof BulkItemAddWizard>[0] = {
  open: true,
  onClose: vi.fn(),
  onAdd: vi.fn().mockResolvedValue(undefined),
};

async function goToSubcategories(
  user: ReturnType<typeof userEvent.setup>,
  category: 'Equipment' | 'Food' = 'Equipment'
) {
  render(<BulkItemAddWizard {...defaultProps} />);
  await user.click(screen.getByText(category));
}

async function goToItems(user: ReturnType<typeof userEvent.setup>) {
  render(<BulkItemAddWizard {...defaultProps} />);
  await user.click(screen.getByText('Equipment'));
  await user.click(screen.getByText('First Aid and Safety'));
}

describe('BulkItemAddWizard', () => {
  describe('Step 1 — Category', () => {
    it('renders category selection buttons', () => {
      render(<BulkItemAddWizard {...defaultProps} />);

      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<BulkItemAddWizard {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Step 2 — Subcategory', () => {
    it('shows subcategories after selecting equipment', async () => {
      const user = userEvent.setup();
      await goToSubcategories(user, 'Equipment');

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Venue Setup and Layout')).toBeInTheDocument();
      expect(screen.getByText('First Aid and Safety')).toBeInTheDocument();
    });

    it('shows subcategories after selecting food', async () => {
      const user = userEvent.setup();
      await goToSubcategories(user, 'Food');

      expect(screen.getByText('Fresh Vegetables')).toBeInTheDocument();
      expect(screen.getByText('Dairy')).toBeInTheDocument();
    });

    it('navigates back to category step', async () => {
      const user = userEvent.setup();
      await goToSubcategories(user, 'Equipment');

      await user.click(screen.getByText('Back'));

      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });

  describe('Step 3 — Item selection', () => {
    it('shows items for the selected subcategory', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      expect(
        screen.getByPlaceholderText('Search or add items…')
      ).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
    });

    it('filters items by search text', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const searchInput = screen.getByPlaceholderText('Search or add items…');
      await user.type(searchInput, 'antiseptic');

      expect(screen.getByText('Antiseptic Wipes')).toBeInTheDocument();
      expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
    });

    it('selects and deselects an item', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const card = screen.getByRole('button', { name: 'First Aid Kit' });
      await user.click(card);
      expect(screen.getByText('Add 1 item')).toBeInTheDocument();

      await user.click(card);
      expect(screen.getByText('Select items to add')).toBeInTheDocument();
    });

    it('select all toggles all items', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      await user.click(screen.getByText('Select all'));
      expect(screen.getByText('Deselect all')).toBeInTheDocument();
      expect(screen.getByText(/Add \d+ items?/)).toBeInTheDocument();

      await user.click(screen.getByText('Deselect all'));
      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('Select items to add')).toBeInTheDocument();
    });

    it('adds a custom item via search', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const searchInput = screen.getByPlaceholderText('Search or add items…');
      await user.type(searchInput, 'My Custom Item');

      const addCustomRow = screen.getByTestId('bulk-add-custom-row');
      expect(addCustomRow).toBeInTheDocument();
      await user.click(addCustomRow);

      expect(screen.getByText('My Custom Item')).toBeInTheDocument();
      expect(screen.getByText('Add 1 item')).toBeInTheDocument();
    });

    it('adds custom item via Enter key in search', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const searchInput = screen.getByPlaceholderText('Search or add items…');
      await user.type(searchInput, 'Custom Tent{Enter}');

      expect(screen.getByText('Custom Tent')).toBeInTheDocument();
      expect(screen.getByText('Add 1 item')).toBeInTheDocument();
    });

    it('adjusts quantity with + button', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const card = screen.getByRole('button', { name: 'First Aid Kit' });
      await user.click(card);

      const plusBtn = within(card).getByText('+');
      await user.click(plusBtn);

      expect(within(card).getByText('2')).toBeInTheDocument();
    });

    it('calls onAdd with selected items on submit', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      render(<BulkItemAddWizard open onClose={vi.fn()} onAdd={onAdd} />);

      await user.click(screen.getByText('Equipment'));
      await user.click(screen.getByText('First Aid and Safety'));

      const card = screen.getByRole('button', { name: 'First Aid Kit' });
      await user.click(card);

      await user.click(screen.getByText('Add 1 item'));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledOnce();
      });
      const payloads = onAdd.mock.calls[0][0];
      expect(payloads).toHaveLength(1);
      expect(payloads[0]).toMatchObject({
        name: 'First Aid Kit',
        category: 'equipment',
        quantity: 1,
        subcategory: 'First Aid and Safety',
      });
    });

    it('navigates back to subcategory step', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      await user.click(screen.getByText('Back'));

      expect(screen.getByText('Venue Setup and Layout')).toBeInTheDocument();
      expect(screen.getByText('First Aid and Safety')).toBeInTheDocument();
    });
  });

  describe('Quantity suggestion with planPoints', () => {
    async function goToFoodItems(
      user: ReturnType<typeof userEvent.setup>,
      props: Partial<Parameters<typeof BulkItemAddWizard>[0]> = {}
    ) {
      render(<BulkItemAddWizard {...defaultProps} {...props} />);
      await user.click(screen.getByText('Food'));
      await user.click(screen.getByText('Breakfast Staples'));
    }

    it('uses suggested quantity for food items when planPoints is provided', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      await goToFoodItems(user, { onAdd, planPoints: 10 });

      const breadCard = screen.getByTestId('bulk-item-bread');
      await user.click(breadCard);

      expect(within(breadCard).getByText('2')).toBeInTheDocument();

      await user.click(screen.getByText('Add 1 item'));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledOnce();
      });
      const payloads = onAdd.mock.calls[0][0];
      expect(payloads[0]).toMatchObject({
        name: 'Bread',
        category: 'food',
        quantity: 2,
      });
    });

    it('uses quantity 1 for food items when planPoints is not provided', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      await goToFoodItems(user, { onAdd });

      const breadCard = screen.getByTestId('bulk-item-bread');
      await user.click(breadCard);

      expect(within(breadCard).getByText('1')).toBeInTheDocument();
    });

    it('uses quantity 1 for equipment items even with planPoints', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      render(
        <BulkItemAddWizard {...defaultProps} onAdd={onAdd} planPoints={10} />
      );
      await user.click(screen.getByText('Equipment'));
      await user.click(screen.getByText('First Aid and Safety'));

      const kitCard = screen.getByTestId('bulk-item-first-aid-kit');
      await user.click(kitCard);

      expect(within(kitCard).getByText('1')).toBeInTheDocument();
    });

    it('uses quantity 1 for personal equipment items with planPoints', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      render(
        <BulkItemAddWizard {...defaultProps} onAdd={onAdd} planPoints={40} />
      );
      await user.click(screen.getByText('Equipment'));
      await user.click(screen.getByText('Comfort and Climate Control'));

      const sbCard = screen.getByTestId('bulk-item-sleeping-bag');
      await user.click(sbCard);

      expect(within(sbCard).getByText('1')).toBeInTheDocument();

      await user.click(screen.getByText('Add 1 item'));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledOnce();
      });
      expect(onAdd.mock.calls[0][0][0]).toMatchObject({
        name: 'Sleeping Bag',
        category: 'equipment',
        quantity: 1,
      });
    });

    it('scales quantity with higher planPoints', async () => {
      const user = userEvent.setup();
      await goToFoodItems(user, { planPoints: 40 });

      const breadCard = screen.getByTestId('bulk-item-bread');
      await user.click(breadCard);

      expect(within(breadCard).getByText('6')).toBeInTheDocument();
    });

    it('applies suggested quantities when selecting all', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      await goToFoodItems(user, { onAdd, planPoints: 10 });

      await user.click(screen.getByText('Select all'));
      await user.click(screen.getByText(/Add \d+ items?/));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledOnce();
      });
      const payloads = onAdd.mock.calls[0][0];
      const bread = payloads.find((p: { name: string }) => p.name === 'Bread');
      expect(bread.quantity).toBe(2);
    });
  });
});
