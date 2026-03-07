import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingActions from '../../../../src/components/shared/FloatingActions';

describe('FloatingActions', () => {
  describe('direct-action mode (onAddItem only)', () => {
    it('renders the speed-dial trigger button', () => {
      render(<FloatingActions onAddItem={vi.fn()} />);

      expect(screen.getByTestId('speed-dial-trigger')).toBeInTheDocument();
    });

    it('calls onAddItem directly when clicked (no speed dial)', async () => {
      const onAddItem = vi.fn();
      render(<FloatingActions onAddItem={onAddItem} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));

      expect(onAddItem).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByTestId('speed-dial-backdrop')
      ).not.toBeInTheDocument();
    });

    it('does not render action items in single-action mode', async () => {
      render(<FloatingActions onAddItem={vi.fn()} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));

      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bulk-add-fab')).not.toBeInTheDocument();
    });

    it('does not set aria-expanded in single-action mode', () => {
      render(<FloatingActions onAddItem={vi.fn()} />);

      expect(screen.getByTestId('speed-dial-trigger')).not.toHaveAttribute(
        'aria-expanded'
      );
    });
  });

  describe('speed-dial mode (multiple actions)', () => {
    it('expands on trigger click showing action items', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));

      expect(screen.getByTestId('add-item-fab')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-add-fab')).toBeInTheDocument();
      expect(screen.getByTestId('speed-dial-backdrop')).toBeInTheDocument();
    });

    it('sets aria-expanded on the trigger', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

      const trigger = screen.getByTestId('speed-dial-trigger');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses when trigger is clicked again', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

      const trigger = screen.getByTestId('speed-dial-trigger');
      await userEvent.click(trigger);
      expect(screen.getByTestId('add-item-fab')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();
    });

    it('collapses when backdrop is clicked', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));
      expect(screen.getByTestId('speed-dial-backdrop')).toBeInTheDocument();

      await userEvent.click(screen.getByTestId('speed-dial-backdrop'));
      expect(
        screen.queryByTestId('speed-dial-backdrop')
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();
    });

    it('calls onAddItem and collapses when Add Item action is clicked', async () => {
      const onAddItem = vi.fn();
      render(<FloatingActions onAddItem={onAddItem} onBulkAdd={vi.fn()} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));
      await userEvent.click(screen.getByTestId('add-item-fab'));

      expect(onAddItem).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();
    });

    it('calls onBulkAdd and collapses when Bulk Add action is clicked', async () => {
      const onBulkAdd = vi.fn();
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={onBulkAdd} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));
      await userEvent.click(screen.getByTestId('bulk-add-fab'));

      expect(onBulkAdd).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('bulk-add-fab')).not.toBeInTheDocument();
    });

    it('does not render Bulk Add action when onBulkAdd is omitted', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onAddExpense={vi.fn()} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));

      expect(screen.queryByTestId('bulk-add-fab')).not.toBeInTheDocument();
      expect(screen.getByTestId('add-expense-fab')).toBeInTheDocument();
    });
  });

  describe('with expense action', () => {
    it('renders Add Expense action in speed dial', async () => {
      render(
        <FloatingActions
          onAddItem={vi.fn()}
          onBulkAdd={vi.fn()}
          onAddExpense={vi.fn()}
        />
      );

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));

      expect(screen.getByTestId('add-item-fab')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-add-fab')).toBeInTheDocument();
      expect(screen.getByTestId('add-expense-fab')).toBeInTheDocument();
    });

    it('calls onAddExpense and collapses when expense action is clicked', async () => {
      const onAddExpense = vi.fn();
      render(
        <FloatingActions onAddItem={vi.fn()} onAddExpense={onAddExpense} />
      );

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));
      await userEvent.click(screen.getByTestId('add-expense-fab'));

      expect(onAddExpense).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('add-expense-fab')).not.toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('closes speed dial on Escape key', async () => {
      render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

      await userEvent.click(screen.getByTestId('speed-dial-trigger'));
      expect(screen.getByTestId('add-item-fab')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByTestId('add-item-fab')).not.toBeInTheDocument();
    });
  });

  it('renders with fixed positioning wrapper', () => {
    const { container } = render(<FloatingActions onAddItem={vi.fn()} />);

    const wrapper = container.querySelector('.fixed');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByTestId('speed-dial-trigger'));
  });
});
