import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkAddModal from '../../../src/components/BulkAddModal';

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

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onAdd: vi.fn().mockResolvedValue(undefined),
};

async function goToSubcategories(
  user: ReturnType<typeof userEvent.setup>,
  category: 'Equipment' | 'Food' = 'Equipment'
) {
  render(<BulkAddModal {...defaultProps} />);
  await user.click(screen.getByText(category));
}

async function goToItems(user: ReturnType<typeof userEvent.setup>) {
  render(<BulkAddModal {...defaultProps} />);
  await user.click(screen.getByText('Equipment'));
  await user.click(screen.getByText('First Aid and Safety'));
}

describe('BulkAddModal', () => {
  describe('Step 1 — Category', () => {
    it('renders category selection buttons', () => {
      render(<BulkAddModal {...defaultProps} />);

      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<BulkAddModal {...defaultProps} open={false} />);

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

      expect(screen.getByPlaceholderText('Search items…')).toBeInTheDocument();
      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
    });

    it('filters items by search text', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const searchInput = screen.getByPlaceholderText('Search items…');
      await user.type(searchInput, 'antiseptic');

      expect(screen.getByText('Antiseptic Wipes')).toBeInTheDocument();
      expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
    });

    it('selects and deselects an item', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const firstAidKit = screen.getByText('First Aid Kit');
      const row = firstAidKit.closest('div')!;
      const checkbox = within(row).getByRole('checkbox');

      await user.click(checkbox);
      expect(screen.getByText('Add 1 item')).toBeInTheDocument();

      await user.click(checkbox);
      expect(screen.getByText('Select items to add')).toBeInTheDocument();
    });

    it('select all toggles all items', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      await user.click(screen.getByText('Select all'));
      expect(screen.getByText('Deselect all')).toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(
        (cb) => (cb as HTMLInputElement).checked
      ).length;
      expect(checkedCount).toBeGreaterThan(0);

      await user.click(screen.getByText('Deselect all'));
      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('adds a custom item', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const customInput = screen.getByPlaceholderText('Add custom item…');
      await user.type(customInput, 'My Custom Item');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByText('My Custom Item')).toBeInTheDocument();
      expect(screen.getByText('Add 1 item')).toBeInTheDocument();
    });

    it('adjusts quantity with + button', async () => {
      const user = userEvent.setup();
      await goToItems(user);

      const firstAidKit = screen.getByText('First Aid Kit');
      const row = firstAidKit.closest('div')!;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

      const plusBtn = within(row).getByText('+');
      await user.click(plusBtn);

      expect(within(row).getByText('2')).toBeInTheDocument();
    });

    it('calls onAdd with selected items on submit', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(undefined);
      render(<BulkAddModal open onClose={vi.fn()} onAdd={onAdd} />);

      await user.click(screen.getByText('Equipment'));
      await user.click(screen.getByText('First Aid and Safety'));

      const firstAidKit = screen.getByText('First Aid Kit');
      const row = firstAidKit.closest('div')!;
      const checkbox = within(row).getByRole('checkbox');
      await user.click(checkbox);

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
        status: 'pending',
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
});
