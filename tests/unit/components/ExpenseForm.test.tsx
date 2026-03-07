import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../../../src/components/ExpenseForm';
import type { Participant } from '../../../src/core/schemas/participant';
import type { Item } from '../../../src/core/schemas/item';

const participants: Participant[] = [
  {
    participantId: 'p-owner',
    planId: 'plan-1',
    name: 'Alice',
    lastName: 'Owner',
    contactPhone: '+1111111',
    role: 'owner',
    rsvpStatus: 'confirmed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    participantId: 'p-bob',
    planId: 'plan-1',
    name: 'Bob',
    lastName: 'Helper',
    contactPhone: '+2222222',
    role: 'participant',
    rsvpStatus: 'pending',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

function getAmountInput() {
  return screen.getByPlaceholderText('0.00');
}

function getDescriptionInput() {
  return screen.getByPlaceholderText(/what was this expense/i);
}

describe('ExpenseForm', () => {
  let handleSubmit: ReturnType<typeof vi.fn>;
  let handleCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleSubmit = vi.fn();
    handleCancel = vi.fn();
  });

  function renderOwnerForm(props?: {
    defaultValues?: Record<string, unknown>;
    isSubmitting?: boolean;
    submitLabel?: string;
    currency?: string;
  }) {
    return render(
      <ExpenseForm
        participants={participants}
        isOwner={true}
        currentParticipantId="p-owner"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={props?.isSubmitting}
        submitLabel={props?.submitLabel}
        currency={props?.currency}
        defaultValues={props?.defaultValues}
      />
    );
  }

  function renderParticipantForm(props?: {
    defaultValues?: Record<string, unknown>;
  }) {
    return render(
      <ExpenseForm
        participants={participants}
        isOwner={false}
        currentParticipantId="p-bob"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        defaultValues={props?.defaultValues}
      />
    );
  }

  describe('owner view', () => {
    it('renders participant dropdown for owner', () => {
      renderOwnerForm();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
      expect(screen.getByText('Bob Helper')).toBeInTheDocument();
    });

    it('renders amount and description fields', () => {
      renderOwnerForm();
      expect(getAmountInput()).toBeInTheDocument();
      expect(getDescriptionInput()).toBeInTheDocument();
    });

    it('displays currency in label when provided', () => {
      renderOwnerForm({ currency: 'USD' });
      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });

    it('submits valid form with all fields', async () => {
      renderOwnerForm();
      const user = userEvent.setup();

      await user.selectOptions(screen.getByRole('combobox'), 'p-owner');
      await user.type(getAmountInput(), '29.99');
      await user.type(getDescriptionInput(), 'Groceries');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            participantId: 'p-owner',
            amount: 29.99,
            description: 'Groceries',
          })
        );
      });
    });

    it('submits without description', async () => {
      renderOwnerForm();
      const user = userEvent.setup();

      await user.selectOptions(screen.getByRole('combobox'), 'p-bob');
      await user.type(getAmountInput(), '15');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            participantId: 'p-bob',
            amount: 15,
          })
        );
      });
    });

    it('does not submit when participant not selected', async () => {
      renderOwnerForm();
      const user = userEvent.setup();

      await user.type(getAmountInput(), '10');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });

    it('does not submit when amount is missing', async () => {
      renderOwnerForm();
      const user = userEvent.setup();

      await user.selectOptions(screen.getByRole('combobox'), 'p-owner');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('participant view', () => {
    it('hides participant dropdown for non-owner', () => {
      renderParticipantForm();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('auto-sets participantId to current participant', async () => {
      renderParticipantForm();
      const user = userEvent.setup();

      await user.type(getAmountInput(), '20');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            participantId: 'p-bob',
            amount: 20,
          })
        );
      });
    });
  });

  describe('cancel and submit buttons', () => {
    it('calls onCancel when cancel button clicked', async () => {
      renderOwnerForm();
      const user = userEvent.setup();
      await user.click(screen.getByText(/cancel/i));
      expect(handleCancel).toHaveBeenCalled();
    });

    it('shows custom submit label', () => {
      renderOwnerForm({ submitLabel: 'Update Expense' });
      expect(screen.getByText('Update Expense')).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      renderOwnerForm({ isSubmitting: true });
      expect(screen.getByTestId('expense-form-submit')).toBeDisabled();
    });

    it('shows saving text when submitting', () => {
      renderOwnerForm({ isSubmitting: true });
      expect(screen.getByTestId('expense-form-submit')).toHaveTextContent(
        /saving/i
      );
    });
  });

  describe('edit mode (defaultValues)', () => {
    it('pre-fills form with default values', () => {
      renderOwnerForm({
        defaultValues: {
          participantId: 'p-bob',
          amount: 42.5,
          description: 'Pre-filled',
        },
      });
      expect(getAmountInput()).toHaveValue(42.5);
      expect(getDescriptionInput()).toHaveValue('Pre-filled');
    });

    it('disables participant dropdown in edit mode for owner', () => {
      render(
        <ExpenseForm
          participants={participants}
          isOwner={true}
          isEditMode={true}
          currentParticipantId="p-owner"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={{
            participantId: 'p-bob',
            amount: 42.5,
          }}
        />
      );
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeDisabled();
    });

    it('keeps participant dropdown enabled in create mode for owner', () => {
      renderOwnerForm();
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).not.toBeDisabled();
    });

    it('keeps participant dropdown enabled when isEditMode is false', () => {
      render(
        <ExpenseForm
          participants={participants}
          isOwner={true}
          isEditMode={false}
          currentParticipantId="p-owner"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).not.toBeDisabled();
    });
  });

  describe('itemIds clearing behavior (Bug 2)', () => {
    const items: Item[] = [
      {
        itemId: 'item-1',
        planId: 'plan-1',
        name: 'Tent',
        category: 'equipment',
        quantity: 1,
        unit: 'pcs',
        assignmentStatusList: [],
        isAllParticipants: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('submits undefined itemIds when no items are selected (create mode)', async () => {
      render(
        <ExpenseForm
          participants={participants}
          items={items}
          isOwner={true}
          currentParticipantId="p-owner"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      );
      const user = userEvent.setup();

      await user.selectOptions(screen.getByRole('combobox'), 'p-owner');
      await user.type(getAmountInput(), '10');
      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            participantId: 'p-owner',
            amount: 10,
          })
        );
        const callArgs = handleSubmit.mock.calls[0][0];
        expect(callArgs.itemIds).toBeUndefined();
      });
    });

    it('submits undefined itemIds when all items are deselected', async () => {
      render(
        <ExpenseForm
          participants={participants}
          items={items}
          isOwner={true}
          currentParticipantId="p-owner"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={{
            participantId: 'p-owner',
            amount: 10,
            itemIds: ['item-1'],
          }}
        />
      );
      const user = userEvent.setup();

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();

      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        const callArgs = handleSubmit.mock.calls[0][0];
        expect(callArgs.itemIds).toBeUndefined();
      });
    });
  });

  describe('item multi-select', () => {
    const items: Item[] = [
      {
        itemId: 'item-1',
        planId: 'plan-1',
        name: 'Tent',
        category: 'equipment',
        quantity: 1,
        unit: 'pcs',
        assignmentStatusList: [],
        isAllParticipants: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        itemId: 'item-2',
        planId: 'plan-1',
        name: 'Water Bottles',
        category: 'food',
        quantity: 6,
        unit: 'pcs',
        assignmentStatusList: [],
        isAllParticipants: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    function renderWithItems(props?: {
      defaultValues?: Record<string, unknown>;
    }) {
      return render(
        <ExpenseForm
          participants={participants}
          items={items}
          isOwner={true}
          currentParticipantId="p-owner"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={props?.defaultValues}
        />
      );
    }

    it('shows item select toggle when items are provided', () => {
      renderWithItems();
      expect(screen.getByTestId('toggle-item-select')).toBeInTheDocument();
    });

    it('does not show item select when no items', () => {
      renderOwnerForm();
      expect(
        screen.queryByTestId('toggle-item-select')
      ).not.toBeInTheDocument();
    });

    it('expands item list and shows items grouped by category', async () => {
      renderWithItems();
      const user = userEvent.setup();
      await user.click(screen.getByTestId('toggle-item-select'));
      expect(screen.getByText('Tent')).toBeInTheDocument();
      expect(screen.getByText('Water Bottles')).toBeInTheDocument();
    });

    it('selects and deselects items via checkbox', async () => {
      renderWithItems();
      const user = userEvent.setup();
      await user.click(screen.getByTestId('toggle-item-select'));

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();

      await user.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
    });

    it('submits with selected itemIds', async () => {
      renderWithItems();
      const user = userEvent.setup();

      await user.selectOptions(screen.getByRole('combobox'), 'p-owner');
      await user.type(getAmountInput(), '50');
      await user.click(screen.getByTestId('toggle-item-select'));

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await user.click(screen.getByTestId('expense-form-submit'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            participantId: 'p-owner',
            amount: 50,
            itemIds: ['item-1'],
          })
        );
      });
    });

    it('pre-fills selected items from defaultValues', () => {
      renderWithItems({
        defaultValues: {
          participantId: 'p-owner',
          amount: 30,
          itemIds: ['item-2'],
        },
      });
      const chips = screen.getAllByText('Water Bottles');
      expect(chips.length).toBeGreaterThanOrEqual(1);
    });

    it('filters items by search', async () => {
      renderWithItems();
      const user = userEvent.setup();
      await user.click(screen.getByTestId('toggle-item-select'));

      const searchInput = screen.getByTestId('item-search-input');
      await user.type(searchInput, 'tent');

      expect(screen.getByText('Tent')).toBeInTheDocument();
      expect(screen.queryByText('Water Bottles')).not.toBeInTheDocument();
    });
  });
});
